use std::{fs, path::{Path, PathBuf}};
use tauri::{AppHandle, Manager};
use tokio::process::Command;

pub fn support_dir() -> PathBuf { dirs::data_dir().unwrap_or_else(|| PathBuf::from(".")).join("Rushes") }

/// Reprend réglages, historique et moteurs de l'ancien dossier « TwitchFlow » (renommage de l'app).
pub fn migrate_legacy_dir() {
    let Some(base) = dirs::data_dir() else { return };
    let (old, new) = (base.join("TwitchFlow"), support_dir());
    if old.exists() && !new.exists() { let _ = fs::rename(&old, &new); }
}
pub fn settings_path() -> PathBuf { support_dir().join("settings.json") }
pub fn history_path() -> PathBuf { support_dir().join("downloads.json") }
pub fn engines_dir() -> PathBuf { support_dir().join("engines") }

pub fn ensure_dirs() -> std::io::Result<()> { migrate_legacy_dir(); fs::create_dir_all(engines_dir()) }

pub fn engine_name(name: &str) -> String {
    if cfg!(windows) && !name.ends_with(".exe") { format!("{name}.exe") } else { name.into() }
}

pub fn find_tool(name: &str) -> Option<PathBuf> {
    let file = engine_name(name);
    let local = engines_dir().join(&file);
    if local.exists() { return Some(local); }
    if let Ok(path) = which::which(&file) { return Some(path); }
    if cfg!(target_os = "macos") {
        for base in ["/opt/homebrew/bin", "/usr/local/bin"] {
            let path = Path::new(base).join(&file); if path.exists() { return Some(path); }
        }
    }
    None
}

pub fn install_bundled_engines(app: &AppHandle) -> Result<(), String> {
    ensure_dirs().map_err(|e| e.to_string())?;
    let resource_dir = app.path().resource_dir().map_err(|e| e.to_string())?.join("engines");
    if !resource_dir.exists() { return Ok(()); }
    for entry in fs::read_dir(&resource_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        if !entry.file_type().map_err(|e| e.to_string())?.is_file() { continue; }
        let name = entry.file_name();
        if name.to_string_lossy() == "engines.json" { continue; }
        let dest = engines_dir().join(&name);
        // Recopier les ~190 Mo de moteurs à chaque lancement retardait l'ouverture de la
        // fenêtre d'autant. On ne copie que si la destination diffère de la source, ce qui
        // n'arrive qu'à la première installation et après une mise à jour de Rushes.
        let source_meta = entry.metadata().map_err(|e| e.to_string())?;
        let outdated = match fs::metadata(&dest) {
            Err(_) => true,
            Ok(current) => current.len() != source_meta.len()
                || matches!((source_meta.modified(), current.modified()), (Ok(s), Ok(d)) if s > d),
        };
        if outdated { fs::copy(entry.path(), &dest).map_err(|e| e.to_string())?; }
        #[cfg(unix)] {
            use std::os::unix::fs::PermissionsExt;
            let mut permissions = fs::metadata(&dest).map_err(|e| e.to_string())?.permissions();
            permissions.set_mode(0o755); fs::set_permissions(&dest, permissions).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

pub async fn version(path: &Path, args: &[&str]) -> String {
    match Command::new(path).args(args).output().await {
        Ok(o) => String::from_utf8_lossy(if o.stdout.is_empty(){&o.stderr}else{&o.stdout}).lines().next().unwrap_or("").trim().to_string(),
        Err(_) => String::new(),
    }
}

pub fn threads_for(profile: &str) -> u8 { match profile { "eco"=>2, "normal"=>4, "turbo"=>8, "max"=>10, _=>6 } }
