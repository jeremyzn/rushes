use crate::{models::*, spotify, state::AppState, tools};
use chrono::Utc;
use regex::Regex;
use serde::{de::DeserializeOwned, Serialize};
use serde_json::Value;
use std::{collections::BTreeMap, fs, path::{Path, PathBuf}, process::Stdio, sync::LazyLock, time::{Duration, Instant}};
use tauri::State;
use tokio::{io::{AsyncBufReadExt, BufReader}, process::Command};
use uuid::Uuid;

fn read_json<T: DeserializeOwned>(path:&Path)->Option<T>{fs::read(path).ok().and_then(|b|serde_json::from_slice(&b).ok())}
fn write_json<T:Serialize>(path:&Path,value:&T)->Result<(),String>{if let Some(p)=path.parent(){fs::create_dir_all(p).map_err(|e|e.to_string())?;}let bytes=serde_json::to_vec_pretty(value).map_err(|e|e.to_string())?;fs::write(path,bytes).map_err(|e|e.to_string())}
fn persist(tasks:&Vec<DownloadTask>){let _=write_json(&tools::history_path(),tasks);}

fn friendly_error(raw: &str) -> String {
    let lower = raw.to_lowercase();
    if lower.contains("unsupported url") { return "Cette URL n’est pas encore prise en charge.".into(); }
    if lower.contains("private video") || lower.contains("private") && lower.contains("login") { return "Contenu privé. Si le compte y a accès, activer les cookies navigateur dans Réglages.".into(); }
    if lower.contains("sign in") || lower.contains("login required") || lower.contains("confirm you’re not a bot") { return "La plateforme exige une connexion. Activer les cookies navigateur dans Réglages.".into(); }
    if lower.contains("video unavailable") || lower.contains("not available") || lower.contains("deleted") { return "Média indisponible, supprimé ou restreint dans cette région.".into(); }
    if lower.contains("timed out") || lower.contains("network") || lower.contains("connection") || lower.contains("dns") { return "Erreur réseau. Vérifier la connexion Internet puis réessayer.".into(); }
    raw.lines().rev().find(|l| !l.trim().is_empty()).unwrap_or("Erreur inconnue du moteur média.").trim().to_string()
}

fn provider_from(url:&str, data:&Value)->String {
    let u=url.to_lowercase(); let extractor=data.get("extractor_key").or_else(||data.get("extractor")).and_then(Value::as_str).unwrap_or("").to_lowercase();
    if u.contains("twitch.tv") || extractor.contains("twitch") {"twitch".into()}
    else if u.contains("youtube.com") || u.contains("youtu.be") || extractor.contains("youtube") {"youtube".into()}
    else if u.contains("tiktok.com") || extractor.contains("tiktok") {"tiktok".into()}
    else {"other".into()}
}

fn yt_dlp_base() -> Result<Command,String> {
    let ytdlp=tools::find_tool("yt-dlp").ok_or("Le moteur yt-dlp intégré est introuvable. Réinstaller Rushes ou vérifier Réglages > Moteurs.")?;
    let mut cmd=Command::new(ytdlp);
    if let Some(deno)=tools::find_tool("deno") { cmd.args(["--js-runtimes", &format!("deno:{}",deno.to_string_lossy())]); }
    if let Some(ffmpeg)=tools::find_tool("ffmpeg") { if let Some(parent)=ffmpeg.parent(){cmd.args(["--ffmpeg-location", &parent.to_string_lossy()]);} }
    Ok(cmd)
}

#[tauri::command]
pub async fn analyze_url(url:String)->Result<MediaInfo,String>{
    // Spotify chiffre ses flux : on lit seulement ses métadonnées publiques, puis
    // l'audio est cherché sur YouTube. Aucune protection n'est contournée.
    let track=if spotify::is_spotify(&url){Some(spotify::resolve(&url).await?)}else{None};
    let target=match &track{Some(t)=>spotify::search_query(t),None=>url.clone()};
    let mut cmd=yt_dlp_base()?;
    cmd.args(["--dump-single-json","--skip-download","--no-playlist","--no-warnings","--ignore-config",&target]);
    let output=cmd.output().await.map_err(|e|e.to_string())?;
    if !output.status.success(){let err=String::from_utf8_lossy(&output.stderr);return Err(friendly_error(&err))}
    let data:Value=serde_json::from_slice(&output.stdout).map_err(|e|format!("Réponse média invalide: {e}"))?;
    let provider=if track.is_some(){"spotify".to_string()}else{provider_from(&url,&data)};
    let is_live=data.get("is_live").and_then(Value::as_bool).unwrap_or(false) || matches!(data.get("live_status").and_then(Value::as_str),Some("is_live"));
    let media_type=if track.is_some(){"music"}else if is_live{"live"}else if provider=="twitch"&&url.to_lowercase().contains("clip"){"clip"}else if provider=="twitch"{"vod"}else if (provider=="youtube"&&url.to_lowercase().contains("shorts/"))||provider=="tiktok"{"short"}else{"video"};
    let mut quality_map:BTreeMap<(u64,u64),String>=BTreeMap::new();
    if let Some(formats)=data.get("formats").and_then(Value::as_array){for f in formats{let h=f.get("height").and_then(Value::as_u64).unwrap_or(0);if h==0{continue}let fps=f.get("fps").and_then(Value::as_f64).unwrap_or(0.0).round() as u64;let ext=f.get("ext").and_then(Value::as_str).unwrap_or("");let codec=f.get("vcodec").and_then(Value::as_str).unwrap_or("");quality_map.entry((h,fps)).or_insert(format!("{} · {}",ext.to_uppercase(),codec));}}
    let mut qualities=vec![QualityOption{id:"best".into(),label:"Meilleure qualité".into(),detail:Some("Source / automatique".into()),height:None,fps:None}];
    for ((h,fps),detail) in quality_map.into_iter().rev().take(10){let label=if fps>=50{format!("{}p{}",h,fps)}else{format!("{}p",h)};qualities.push(QualityOption{id:label.clone(),label,detail:Some(detail),height:Some(h),fps:Some(fps as f64)});}
    let title=match &track{Some(t)=>t.title.clone(),None=>data.get("title").and_then(Value::as_str).unwrap_or("Sans titre").into()};
    let author=match &track{Some(t) if !t.artist.is_empty()=>t.artist.clone(),_=>data.get("uploader").or_else(||data.get("channel")).and_then(Value::as_str).unwrap_or("Créateur").into()};
    let thumbnail=match &track{Some(t) if !t.thumbnail.is_empty()=>t.thumbnail.clone(),_=>data.get("thumbnail").and_then(Value::as_str).unwrap_or("").into()};
    Ok(MediaInfo{url,provider,media_type:media_type.into(),id:data.get("id").and_then(Value::as_str).unwrap_or("").into(),title,author,category:data.get("categories").and_then(Value::as_array).and_then(|a|a.first()).and_then(Value::as_str).unwrap_or("").into(),duration:data.get("duration").and_then(Value::as_f64).unwrap_or(0.0),thumbnail,is_live,qualities})
}

fn build_download_command(r:&DownloadRequest, settings:&Settings)->Result<Command,String>{
    let mut c=yt_dlp_base()?; let threads=tools::threads_for(&r.speed_profile);
    c.args(["--ignore-config","--newline","--progress","--no-colors","--continue","--retries","20","--fragment-retries","20","--retry-sleep","http:exp=1:20","--retry-sleep","fragment:exp=1:20","-N",&threads.to_string(),"--no-playlist"]);
    let outdir=PathBuf::from(&settings.output_dir);fs::create_dir_all(&outdir).map_err(|e|e.to_string())?;
    // Template de sortie en chemin absolu : yt-dlp annonce alors une destination absolue,
    // seule forme que `openPath` et `revealItemInDir` savent ouvrir côté interface.
    let template=outdir.join("%(uploader)s - %(title).180B [%(id)s].%(ext)s");
    c.args(["-o",&template.to_string_lossy()]);
    if settings.download_thumbnail { c.arg("--write-thumbnail"); }
    if settings.cookies_browser!="none" { c.args(["--cookies-from-browser",&settings.cookies_browser]); }
    if r.mode=="audio" { let af=r.audio_format.as_deref().unwrap_or(&settings.audio_format); c.args(["-x","--audio-format",af,"--audio-quality","0"]); }
    else {
        if r.quality!="best" { if let Some(h)=Regex::new(r"(\d+)p").unwrap().captures(&r.quality).and_then(|c|c.get(1)){let n=h.as_str();c.args(["-f",&format!("bv*[height<={n}]+ba/b[height<={n}]")]);} }
        else { c.args(["-f","bv*+ba/b"]); }
        let container=r.container.as_deref().unwrap_or(&settings.container); if container=="mp4"||container=="mkv" {c.args(["--merge-output-format",container]);}
    }
    if r.media_type=="live" { c.args(["--live-from-start","--hls-use-mpegts"]); }
    c.arg(&r.url); c.stdout(Stdio::piped()).stderr(Stdio::piped()); Ok(c)
}

fn spawn_for_task(id:String, request:DownloadRequest, state:AppState)->Result<(),String>{
    let settings:Settings=read_json(&tools::settings_path()).unwrap_or_default();
    let mut cmd=build_download_command(&request,&settings)?;
    let mut child=cmd.spawn().map_err(|e|friendly_error(&e.to_string()))?;
    let pid=child.id();
    let stdout=child.stdout.take();let stderr=child.stderr.take();
    {let mut tasks=state.tasks.lock();if let Some(t)=tasks.iter_mut().find(|t|t.id==id){t.state="downloading".into();t.pid=pid;t.error=None;}persist(&tasks)}
    state.children.lock().insert(id.clone(),child);
    let st1=state.clone();let tid1=id.clone();if let Some(out)=stdout{tauri::async_runtime::spawn(async move{let mut lines=BufReader::new(out).lines();while let Ok(Some(line))=lines.next_line().await{update_progress(&st1,&tid1,&line);}});}
    let st2=state.clone();let tid2=id.clone();if let Some(err)=stderr{tauri::async_runtime::spawn(async move{let mut lines=BufReader::new(err).lines();while let Ok(Some(line))=lines.next_line().await{update_progress(&st2,&tid2,&line);}});}
    let final_state=state.clone();tauri::async_runtime::spawn(async move{
        loop {
            tokio::time::sleep(Duration::from_millis(350)).await;
            let finished={let mut map=final_state.children.lock();if let Some(c)=map.get_mut(&id){match c.try_wait(){Ok(Some(s))=>Some(s),Ok(None)=>None,Err(_)=>None}}else{return}};
            if let Some(status)=finished{
                final_state.children.lock().remove(&id);
                {let mut tasks=final_state.tasks.lock();if let Some(t)=tasks.iter_mut().find(|t|t.id==id){if !["paused","cancelled"].contains(&t.state.as_str()){if status.success(){t.state="completed".into();t.progress=1.0;t.speed_bps=0.0;t.eta_seconds=Some(0);}else{t.state="error".into();t.speed_bps=0.0;if t.error.is_none(){t.error=Some("Le moteur de téléchargement s'est arrêté. Réessayer ou vérifier la connexion.".into());}}}persist(&tasks)}}
                tauri::async_runtime::spawn(Box::pin(schedule_queue(final_state.clone())));
                return;
            }
        }
    });
    Ok(())
}

async fn schedule_queue(state:AppState){
    let _schedule_guard=state.scheduler.lock().await;
    loop {
        let settings:Settings=read_json(&tools::settings_path()).unwrap_or_default();
        let limit=settings.concurrent_downloads.clamp(1,4) as usize;
        if state.children.lock().len()>=limit{return;}
        let next={
            let mut tasks=state.tasks.lock();
            if let Some(t)=tasks.iter_mut().rev().find(|t|t.state=="queued"){
                t.state="preparing".into();
                let item=(t.id.clone(),t.request.clone());persist(&tasks);Some(item)
            }else{None}
        };
        let Some((id,request))=next else{return;};
        if let Err(err)=spawn_for_task(id.clone(),request,state.clone()){
            let mut tasks=state.tasks.lock();if let Some(t)=tasks.iter_mut().find(|t|t.id==id){t.state="error".into();t.error=Some(friendly_error(&err));}persist(&tasks);
        }
    }
}

#[tauri::command]
pub async fn start_download(request:DownloadRequest,state:State<'_,AppState>)->Result<DownloadTask,String>{
    // L'affichage conserve le lien collé, le moteur reçoit la requête YouTube.
    let mut request=request;
    let source=request.url.clone();
    if spotify::is_spotify(&request.url){
        let track=spotify::resolve(&request.url).await?;
        request.url=spotify::search_query(&track);
        if request.mode!="audio"{request.mode="audio".into()}
    }
    let settings:Settings=read_json(&tools::settings_path()).unwrap_or_default();let id=Uuid::new_v4().to_string();let task=DownloadTask{id:id.clone(),url:source,provider:request.provider.clone(),title:request.title.clone(),author:request.author.clone(),thumbnail:request.thumbnail.clone(),quality:request.quality.clone(),mode:request.mode.clone(),state:"queued".into(),progress:0.0,speed_bps:0.0,downloaded_bytes:0,total_bytes:None,eta_seconds:None,engine:Some("yt-dlp".into()),error:None,output_path:Some(settings.output_dir.clone()),created_at:Utc::now().to_rfc3339(),media_type:request.media_type.clone(),request:request.clone(),pid:None};
    {let mut tasks=state.tasks.lock();tasks.insert(0,task.clone());persist(&tasks)}
    schedule_queue(state.inner().clone()).await;
    Ok(task)
}

fn parse_size(s:&str,unit:&str)->f64{let n=s.parse::<f64>().unwrap_or(0.0);n*match unit{"TiB"=>1024f64.powi(4),"GiB"=>1024f64.powi(3),"MiB"=>1024f64.powi(2),"KiB"=>1024.0,_=>1.0}}

// Ligne type : "[download]  45.2% of ~  1.20GiB at    3.10MiB/s ETA 00:25 (frag 12/40)"
static RE_PCT:LazyLock<Regex>=LazyLock::new(||Regex::new(r"^\[download\]\s+(\d{1,3}(?:\.\d+)?)%").unwrap());
static RE_TOTAL:LazyLock<Regex>=LazyLock::new(||Regex::new(r"\bof\s+~?\s*(\d+(?:\.\d+)?)(B|KiB|MiB|GiB|TiB)\b").unwrap());
static RE_SPEED:LazyLock<Regex>=LazyLock::new(||Regex::new(r"\bat\s+(\d+(?:\.\d+)?)(B|KiB|MiB|GiB)/s").unwrap());
static RE_ETA:LazyLock<Regex>=LazyLock::new(||Regex::new(r"\bETA\s+(?:(\d+):)?(\d+):(\d+)").unwrap());
static RE_DEST:LazyLock<Regex>=LazyLock::new(||Regex::new(r#"(?:\[download\] Destination:|Merging formats into|\[ExtractAudio\] Destination:)\s+["']?(.+?)["']?$"#).unwrap());

fn update_progress(st:&AppState,id:&str,line:&str){
    let line=line.trim();
    let mut tasks=st.tasks.lock();let Some(t)=tasks.iter_mut().find(|t|t.id==id) else {return};
    if let Some(c)=RE_PCT.captures(line){
        t.progress=c[1].parse::<f64>().unwrap_or(0.0)/100.0;
        if let Some(c)=RE_TOTAL.captures(line){let total=parse_size(&c[1],&c[2]) as u64;t.total_bytes=Some(total);t.downloaded_bytes=(total as f64*t.progress) as u64;}
        if let Some(c)=RE_SPEED.captures(line){t.speed_bps=parse_size(&c[1],&c[2]);}
        if let Some(c)=RE_ETA.captures(line){let h=c.get(1).map(|m|m.as_str().parse::<u64>().unwrap_or(0)).unwrap_or(0);t.eta_seconds=Some(h*3600+c[2].parse::<u64>().unwrap_or(0)*60+c[3].parse::<u64>().unwrap_or(0));}
    }
    // Post-traitement (fusion audio/vidéo, extraction audio, remux) : plus de flux réseau
    if line.starts_with("[Merger]")||line.starts_with("[ExtractAudio]")||line.starts_with("[FixupM3u8]")||line.starts_with("[VideoConvertor]") {
        if t.state=="downloading" { t.state="finalizing".into(); t.speed_bps=0.0; t.eta_seconds=None; }
    }
    if let Some(c)=RE_DEST.captures(line){t.output_path=Some(c[1].to_string());}
    if line.to_lowercase().starts_with("error:") { t.error=Some(friendly_error(line)); }
}

#[tauri::command]
pub fn list_downloads(state:State<'_,AppState>)->Vec<DownloadTask>{
    let mut tasks=state.tasks.lock();
    if tasks.is_empty(){
        if let Some(mut v)=read_json::<Vec<DownloadTask>>(&tools::history_path()){
            for t in &mut v {
                if t.provider.is_empty(){t.provider=provider_from(&t.url,&Value::Null);}
                if t.mode.is_empty(){t.mode="video".into();}
                if ["downloading","preparing","finalizing"].contains(&t.state.as_str()){t.state="paused".into();t.speed_bps=0.0;t.error=Some("Téléchargement interrompu lors de la fermeture précédente. Reprise possible.".into());}
                if t.request.url.is_empty(){t.request=DownloadRequest{url:t.url.clone(),provider:t.provider.clone(),title:t.title.clone(),author:t.author.clone(),thumbnail:t.thumbnail.clone(),quality:t.quality.clone(),media_type:t.media_type.clone(),speed_profile:"auto".into(),mode:t.mode.clone(),audio_format:None,container:None};}
            }
            *tasks=v;
        }
    }
    tasks.clone()
}

#[tauri::command]
pub async fn task_action(id:String,action:String,state:State<'_,AppState>)->Result<(),String>{
    if action=="pause"||action=="cancel" {
        let child=state.children.lock().remove(&id);if let Some(mut c)=child{let _=c.kill().await;}
        {let mut tasks=state.tasks.lock();if let Some(t)=tasks.iter_mut().find(|t|t.id==id){match action.as_str(){"pause"=>{t.state="paused".into();t.speed_bps=0.0},"cancel"=>{t.state="cancelled".into();t.speed_bps=0.0},_=>{}}}persist(&tasks)}
        schedule_queue(state.inner().clone()).await;
        return Ok(());
    }
    if action=="resume"||action=="retry" {
        {let mut tasks=state.tasks.lock();let t=tasks.iter_mut().find(|t|t.id==id).ok_or("Téléchargement introuvable")?;if action=="retry"{t.progress=0.0;t.downloaded_bytes=0;t.total_bytes=None;t.eta_seconds=None;}t.state="queued".into();t.error=None;persist(&tasks)}
        schedule_queue(state.inner().clone()).await;
        return Ok(());
    }
    Err("Action de téléchargement inconnue".into())
}

#[tauri::command]
pub async fn remove_task(id:String,state:State<'_,AppState>)->Result<(),String>{
    let child=state.children.lock().remove(&id);if let Some(mut c)=child{let _=c.kill().await;}
    {let mut tasks=state.tasks.lock();tasks.retain(|t|t.id!=id);persist(&tasks)}
    schedule_queue(state.inner().clone()).await;
    Ok(())
}

#[tauri::command]
pub fn clear_finished(state:State<'_,AppState>)->Result<(),String>{
    let mut tasks=state.tasks.lock();tasks.retain(|t|!["completed","cancelled","error"].contains(&t.state.as_str()));persist(&tasks);Ok(())
}

#[tauri::command] pub fn load_settings()->Settings{read_json(&tools::settings_path()).unwrap_or_default()}
#[tauri::command] pub fn save_settings(settings:Settings)->Result<(),String>{write_json(&tools::settings_path(),&settings)}

#[tauri::command]
pub async fn engine_status()->Vec<EngineStatus>{let specs=[("yt-dlp","yt-dlp",vec!["--version"]),("FFmpeg","ffmpeg",vec!["-version"]),("FFprobe","ffprobe",vec!["-version"]),("Deno","deno",vec!["--version"])];let dir=tools::engines_dir();let mut out=vec![];for(name,bin,args)in specs{if let Some(p)=tools::find_tool(bin){out.push(EngineStatus{name:name.into(),version:tools::version(&p,&args).await,available:true,bundled:p.starts_with(&dir),path:Some(p.to_string_lossy().into())})}else{out.push(EngineStatus{name:name.into(),version:String::new(),available:false,bundled:false,path:None})}}out}

#[tauri::command]
pub async fn update_engines()->Result<String,String>{
    let mut notes=Vec::new();
    if let Some(y)=tools::find_tool("yt-dlp"){let s=Command::new(y).arg("-U").status().await.map_err(|e|e.to_string())?;notes.push(format!("yt-dlp: {}",if s.success(){"OK"}else{"à vérifier"}));}
    // Le binaire Deno officiel est compilé sans `deno upgrade` : il suit les mises à jour de l'app, comme FFmpeg.
    notes.push("Deno et FFmpeg suivent les mises à jour de Rushes".into());Ok(notes.join(" · "))
}

#[tauri::command]
pub async fn install_js_runtime()->Result<String,String>{
    let target=tools::deno_target().ok_or("Aucun moteur JavaScript n'est publié pour cette plateforme.")?;
    let url=format!("https://github.com/denoland/deno/releases/latest/download/deno-{target}.zip");
    let client=reqwest::Client::builder().timeout(Duration::from_secs(600)).build().map_err(|e|e.to_string())?;
    let response=client.get(&url).header("User-Agent","Rushes").send().await.map_err(|e|friendly_error(&e.to_string()))?;
    if !response.status().is_success(){return Err(format!("Téléchargement refusé par GitHub ({}).",response.status()))}
    let archive=response.bytes().await.map_err(|e|friendly_error(&e.to_string()))?;

    tools::ensure_dirs().map_err(|e|e.to_string())?;
    let binary=tools::engine_name("deno");
    let destination=tools::engines_dir().join(&binary);
    // L'extraction est bloquante : la sortir du runtime évite de figer l'interface.
    let bytes=archive.to_vec();
    tauri::async_runtime::spawn_blocking(move||->Result<(),String>{
        let mut zip=zip::ZipArchive::new(std::io::Cursor::new(bytes)).map_err(|e|format!("Archive illisible: {e}"))?;
        let mut entry=zip.by_name(&binary).map_err(|_|"Le binaire attendu est absent de l'archive.".to_string())?;
        let mut file=std::fs::File::create(&destination).map_err(|e|e.to_string())?;
        std::io::copy(&mut entry,&mut file).map_err(|e|e.to_string())?;
        #[cfg(unix)] {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&destination,std::fs::Permissions::from_mode(0o755)).map_err(|e|e.to_string())?;
        }
        Ok(())
    }).await.map_err(|e|e.to_string())??;

    let installed=tools::find_tool("deno").ok_or("Installation terminée mais le binaire reste introuvable.")?;
    Ok(tools::version(&installed,&["--version"]).await)
}

#[tauri::command]
pub fn remove_js_runtime()->Result<(),String>{
    let path=tools::engines_dir().join(tools::engine_name("deno"));
    if path.exists(){fs::remove_file(&path).map_err(|e|e.to_string())?}
    Ok(())
}

#[tauri::command]
pub async fn network_status()->NetworkStatus{
    let start=Instant::now();
    let client=reqwest::Client::builder().timeout(Duration::from_secs(3)).build();
    let mut online=false;
    if let Ok(client)=client {
        for endpoint in ["https://www.gstatic.com/generate_204","https://www.cloudflare.com/cdn-cgi/trace"] {
            if client.get(endpoint).send().await.map(|r|r.status().is_success()).unwrap_or(false) { online=true; break; }
        }
    }
    NetworkStatus{online,latency_ms:if online{Some(start.elapsed().as_millis())}else{None},checked_at:Utc::now().to_rfc3339()}
}

#[tauri::command]
pub fn runtime_info(app:tauri::AppHandle)->RuntimeInfo{RuntimeInfo{os:std::env::consts::OS.into(),arch:std::env::consts::ARCH.into(),version:env!("CARGO_PKG_VERSION").into(),updater_enabled:app.config().plugins.0.contains_key("updater")}}

#[cfg(test)]
mod tests {
    use super::*;
    fn task(id:&str)->DownloadTask{serde_json::from_value(serde_json::json!({"id":id,"url":"","provider":"twitch","title":"","author":"","quality":"best","mode":"video","state":"downloading","progress":0.0,"speedBps":0.0,"downloadedBytes":0,"createdAt":"","mediaType":"vod"})).unwrap()}

    #[test]
    fn parse_ligne_ytdlp_reelle(){
        let st=AppState::default();st.tasks.lock().push(task("a"));
        update_progress(&st,"a","[download] Destination: La vengeance de Teddy VS Fack7up Les Gremlins. [v2871399467].mp4");
        update_progress(&st,"a","[download]  32.0% of ~   2.37GiB at   79.68MiB/s ETA 00:21 (frag 199/621)");
        let t=st.tasks.lock()[0].clone();
        assert!((t.progress-0.32).abs()<1e-9);
        assert_eq!(t.total_bytes,Some((2.37*1024f64.powi(3)) as u64));
        assert!((t.speed_bps-79.68*1024f64.powi(2)).abs()<1.0);
        assert_eq!(t.eta_seconds,Some(21));
        assert_eq!(t.output_path.as_deref(),Some("La vengeance de Teddy VS Fack7up Les Gremlins. [v2871399467].mp4"));
        update_progress(&st,"a","[Merger] Merging formats into \"x.mp4\"");
        assert_eq!(st.tasks.lock()[0].state,"finalizing");
    }
}
