/*
   Prise en charge des liens Spotify.

   Spotify chiffre ses flux avec Widevine : aucun outil ne peut en extraire
   l'audio sans casser cette protection, ce que Rushes ne fait pas. On suit donc
   la même voie que spotDL : Spotify fournit les métadonnées publiques (titre,
   artistes, durée), et l'audio vient de YouTube via une recherche.

   Les métadonnées viennent du lecteur intégrable (`/embed/…`), public et sans
   clé d'API. Depuis février 2026, l'API Web exige un compte Premium et limite
   les applications en mode développement : elle n'est plus une option pour une
   application distribuée. La page principale ne convient pas non plus : avec
   un paramètre `si` et un navigateur de bureau, Spotify renvoie une page de
   redirection vers l'application, sans aucune métadonnée.

   Limite connue : le lecteur intégrable expose au plus 100 morceaux d'une
   playlist. Le nombre réel est lu sur la page principale pour le signaler.
   */
use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::LazyLock;
use std::time::Duration;

static RE_LINK: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"(?i)open\.spotify\.com/(?:intl-[a-z]{2}(?:-[a-z]{2})?/)?(?:embed/)?(track|album|playlist|artist|episode|show)/([a-z0-9]{22})").unwrap()
});
static RE_URI: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?i)^spotify:(track|album|playlist|artist|episode|show):([a-z0-9]{22})$").unwrap());
static RE_NEXT_DATA: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r#"<script id="__NEXT_DATA__" type="application/json">([\s\S]*?)</script>"#).unwrap());
static RE_INITIAL_STATE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r#"<script id="initialState" type="text/plain">([^<]+)</script>"#).unwrap());

/// Lien Spotify décomposé.
#[derive(Debug, Clone, PartialEq)]
pub struct Link {
    pub kind: String,
    pub id: String,
}

/// Morceau ou épisode à retrouver sur YouTube.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Entry {
    pub id: String,
    pub url: String,
    pub title: String,
    pub artist: String,
    /// Durée en secondes.
    pub duration: f64,
}

/// Contenu d'un lien Spotify : un seul morceau, ou une liste.
pub struct Resolved {
    pub kind: String,
    pub title: String,
    pub subtitle: String,
    pub thumbnail: String,
    pub entries: Vec<Entry>,
    /// Nombre de morceaux annoncé par Spotify, quand il dépasse ce que l'on a pu lire.
    pub total: Option<usize>,
}

pub fn is_spotify(url: &str) -> bool {
    let lower = url.trim().to_lowercase();
    lower.contains("open.spotify.com/") || lower.contains("spotify.link/") || lower.starts_with("spotify:")
}

pub fn parse(url: &str) -> Option<Link> {
    let url = url.trim();
    RE_LINK.captures(url).or_else(|| RE_URI.captures(url))
        .map(|c| Link { kind: c[1].to_lowercase(), id: c[2].to_string() })
}

fn client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(20))
        // Un agent de navigateur déclenche la page de redirection vers l'application.
        .user_agent("Rushes")
        .build().map_err(|e| e.to_string())
}

/// Les liens courts `spotify.link` redirigent vers `open.spotify.com`.
async fn expand(client: &reqwest::Client, url: &str) -> Result<Link, String> {
    if let Some(link) = parse(url) { return Ok(link) }
    if !url.to_lowercase().contains("spotify.link/") { return Err("Lien Spotify non reconnu.".into()) }
    let response = client.get(url).send().await.map_err(|e| e.to_string())?;
    if let Some(link) = parse(response.url().as_str()) { return Ok(link) }
    let body = response.text().await.map_err(|e| e.to_string())?;
    parse(&body).ok_or_else(|| "Ce lien court Spotify ne mène à aucun contenu reconnu.".into())
}

async fn embed_entity(client: &reqwest::Client, link: &Link) -> Result<Value, String> {
    let url = format!("https://open.spotify.com/embed/{}/{}", link.kind, link.id);
    let page = client.get(&url).send().await.map_err(|e| e.to_string())?;
    if !page.status().is_success() { return Err(format!("Spotify a refusé la demande ({}).", page.status())) }
    let html = page.text().await.map_err(|e| e.to_string())?;
    let raw = RE_NEXT_DATA.captures(&html).ok_or("Spotify a changé sa page : métadonnées introuvables.")?;
    let data: Value = serde_json::from_str(&raw[1]).map_err(|e| format!("Métadonnées Spotify illisibles : {e}"))?;
    data.pointer("/props/pageProps/state/data/entity").cloned()
        .ok_or_else(|| "Contenu Spotify introuvable, privé ou indisponible dans cette région.".into())
}

fn text(value: &Value, key: &str) -> String {
    value.get(key).and_then(Value::as_str).unwrap_or("").trim().to_string()
}

fn seconds(value: &Value) -> f64 {
    value.get("duration").and_then(Value::as_f64).unwrap_or(0.0) / 1000.0
}

/// Plus grande image proposée, qu'elle soit rangée en `visualIdentity` ou en `coverArt`.
fn cover(entity: &Value) -> String {
    let mut images: Vec<(u64, String)> = Vec::new();
    for list in [entity.pointer("/visualIdentity/image"), entity.pointer("/coverArt/sources"), entity.pointer("/relatedEntityCoverArt")] {
        for image in list.and_then(Value::as_array).into_iter().flatten() {
            let url = text(image, "url");
            let size = image.get("maxWidth").or_else(|| image.get("width")).and_then(Value::as_u64).unwrap_or(0);
            if !url.is_empty() { images.push((size, url)) }
        }
    }
    images.into_iter().max_by_key(|(size, _)| *size).map(|(_, url)| url).unwrap_or_default()
}

fn entry_id(uri: &str) -> String { uri.rsplit(':').next().unwrap_or("").to_string() }

fn entry_url(kind: &str, id: &str) -> String { format!("https://open.spotify.com/{kind}/{id}") }

/// Nombre réel de morceaux d'une playlist, lu sur la page principale.
async fn playlist_total(client: &reqwest::Client, id: &str) -> Option<usize> {
    let html = client.get(entry_url("playlist", id)).send().await.ok()?.text().await.ok()?;
    let encoded = RE_INITIAL_STATE.captures(&html)?;
    let decoded = base64_decode(encoded[1].trim())?;
    let state: Value = serde_json::from_slice(&decoded).ok()?;
    state.pointer(&format!("/entities/items/spotify:playlist:{id}/content/totalCount"))?.as_u64().map(|n| n as usize)
}

fn base64_decode(input: &str) -> Option<Vec<u8>> {
    let mut out = Vec::with_capacity(input.len() * 3 / 4);
    let (mut buffer, mut bits) = (0u32, 0u8);
    for byte in input.bytes() {
        let value = match byte {
            b'A'..=b'Z' => byte - b'A',
            b'a'..=b'z' => byte - b'a' + 26,
            b'0'..=b'9' => byte - b'0' + 52,
            b'+' | b'-' => 62,
            b'/' | b'_' => 63,
            b'=' | b'\n' | b'\r' => continue,
            _ => return None,
        } as u32;
        buffer = (buffer << 6) | value;
        bits += 6;
        if bits >= 8 { bits -= 8; out.push((buffer >> bits) as u8); buffer &= (1 << bits) - 1; }
    }
    Some(out)
}

/// Lit les métadonnées publiques du lien. L'audio n'est jamais touché ici.
pub async fn resolve(url: &str) -> Result<Resolved, String> {
    let client = client()?;
    let link = expand(&client, url).await?;
    if link.kind == "show" {
        return Err("Spotify ne publie pas la liste des épisodes d'un podcast. Colle le lien d'un épisode.".into());
    }
    let entity = embed_entity(&client, &link).await?;
    let name = text(&entity, "name");
    let title = if name.is_empty() { text(&entity, "title") } else { name };
    let thumbnail = cover(&entity);

    let kind = link.kind.clone();
    match kind.as_str() {
        "track" | "episode" => {
            let artist = match entity.get("artists").and_then(Value::as_array) {
                Some(artists) => artists.iter().map(|a| text(a, "name")).filter(|n| !n.is_empty()).collect::<Vec<_>>().join(", "),
                None => text(&entity, "subtitle"),
            };
            if title.is_empty() { return Err("Morceau introuvable sur Spotify.".into()) }
            let entry = Entry { id: link.id.clone(), url: entry_url(&link.kind, &link.id), title: title.clone(), artist: artist.clone(), duration: seconds(&entity) };
            Ok(Resolved { kind: link.kind, title, subtitle: artist, thumbnail, entries: vec![entry], total: None })
        }
        _ => {
            // Les morceaux non disponibles dans la région Spotify restent retenus :
            // YouTube les propose souvent.
            let entries: Vec<Entry> = entity.get("trackList").and_then(Value::as_array).into_iter().flatten()
                .filter_map(|t| {
                    let uri = text(t, "uri");
                    let kind = uri.split(':').nth(1).unwrap_or("track").to_string();
                    let id = entry_id(&uri);
                    let title = text(t, "title");
                    if id.is_empty() || title.is_empty() { return None }
                    Some(Entry { url: entry_url(&kind, &id), id, title, artist: text(t, "subtitle"), duration: seconds(t) })
                })
                .collect();
            if entries.is_empty() { return Err("Cette liste Spotify est vide ou indisponible dans cette région.".into()) }
            let total = if link.kind == "playlist" && entries.len() >= 100 {
                playlist_total(&client, &link.id).await.filter(|n| *n > entries.len())
            } else { None };
            let subtitle = match link.kind.as_str() { "artist" => "Titres populaires".to_string(), _ => text(&entity, "subtitle") };
            Ok(Resolved { kind: link.kind, title, subtitle, thumbnail, entries, total })
        }
    }
}

/* Correspondance YouTube */

/// Requête de recherche envoyée à yt-dlp. Huit candidats suffisent : la bonne
/// version figure presque toujours dans les premiers résultats.
pub fn search_query(artist: &str, title: &str) -> String {
    let terms = if artist.is_empty() { title.to_string() } else { format!("{artist} - {title}") };
    format!("ytsearch8:{terms}")
}

fn normalize(s: &str) -> String {
    s.to_lowercase().chars().map(|c| if c.is_alphanumeric() { c } else { ' ' }).collect::<String>()
        .split_whitespace().collect::<Vec<_>>().join(" ")
}

/// Versions qui ne sont pas le morceau d'origine, sauf si le titre Spotify les annonce.
const VARIANTS: [&str; 14] = ["live", "cover", "remix", "karaoke", "instrumental", "sped up", "slowed", "nightcore",
    "8d", "reverb", "acoustic", "acoustique", "extended", "bass boosted"];

/// Note un résultat de recherche : plus elle est haute, plus il ressemble au morceau.
/// `None` écarte le candidat (durée trop éloignée).
pub fn score(title: &str, artist: &str, duration: f64, candidate_title: &str, channel: &str, candidate_duration: Option<f64>) -> Option<f64> {
    let (wanted, found, chan) = (normalize(title), normalize(candidate_title), normalize(channel));
    let mut score = 0.0;

    if duration > 0.0 {
        if let Some(d) = candidate_duration {
            let gap = (d - duration).abs();
            // Tolérance : les clips ajoutent souvent une intro, pas plus d'un quart de la durée.
            if gap > (duration * 0.25).max(20.0) { return None }
            score -= gap / 4.0;
        }
    }

    let words: Vec<&str> = wanted.split(' ').filter(|w| !w.is_empty()).collect();
    let matched = words.iter().filter(|w| found.split(' ').any(|f| f == **w)).count();
    if !words.is_empty() { score += 10.0 * matched as f64 / words.len() as f64 }

    let artists: Vec<String> = artist.split(',').map(normalize).filter(|a| !a.is_empty()).collect();
    if artists.iter().any(|a| chan.contains(a.as_str())) { score += 6.0 }
    else if artists.iter().any(|a| found.contains(a.as_str())) { score += 3.0 }
    if chan.ends_with(" topic") { score += 4.0 }
    if found.contains("official audio") || found.contains("audio officiel") || found.ends_with(" audio") { score += 2.0 }

    for variant in VARIANTS {
        let tagged = |s: &str| format!(" {s} ").contains(&format!(" {variant} "));
        if tagged(&found) && !tagged(&wanted) { score -= 8.0 }
    }
    Some(score)
}

/// Choisit le meilleur candidat parmi les entrées d'une recherche yt-dlp à plat.
pub fn best_match(title: &str, artist: &str, duration: f64, search: &Value) -> Option<String> {
    search.get("entries").and_then(Value::as_array)?.iter()
        .filter_map(|e| {
            let url = e.get("url").or_else(|| e.get("webpage_url")).and_then(Value::as_str)?;
            let candidate = e.get("title").and_then(Value::as_str).unwrap_or("");
            let channel = e.get("channel").or_else(|| e.get("uploader")).and_then(Value::as_str).unwrap_or("");
            score(title, artist, duration, candidate, channel, e.get("duration").and_then(Value::as_f64)).map(|s| (s, url.to_string()))
        })
        .max_by(|a, b| a.0.total_cmp(&b.0))
        .map(|(_, url)| url)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reconnait_les_formes_de_lien() {
        let id = "2TL8q8EO60b9lWeozfqYnG";
        for url in [
            "https://open.spotify.com/intl-fr/track/2TL8q8EO60b9lWeozfqYnG?si=33a610758618401b",
            "https://open.spotify.com/track/2TL8q8EO60b9lWeozfqYnG",
            "https://open.spotify.com/intl-pt-br/track/2TL8q8EO60b9lWeozfqYnG",
            "https://open.spotify.com/embed/track/2TL8q8EO60b9lWeozfqYnG?utm_source=oembed",
            "spotify:track:2TL8q8EO60b9lWeozfqYnG",
        ] {
            assert_eq!(parse(url), Some(Link { kind: "track".into(), id: id.into() }), "{url}");
        }
        assert_eq!(parse("https://open.spotify.com/playlist/37i9dQZF1DX5Ejj0EkURtP").unwrap().kind, "playlist");
        assert!(parse("https://open.spotify.com/user/spotify").is_none());
    }

    #[test]
    fn prefere_la_version_originale() {
        let search = serde_json::json!({ "entries": [
            { "url": "https://www.youtube.com/watch?v=live", "title": "Angèle flemme (live)", "channel": "Guered", "duration": 258.0 },
            { "url": "https://www.youtube.com/watch?v=lyrics", "title": "Angèle - Flemme (Paroles)", "channel": "MAYELEVRSE", "duration": 256.0 },
            { "url": "https://www.youtube.com/watch?v=audio", "title": "Angèle - Flemme (Audio)", "channel": "Angèle", "duration": 263.0 },
            { "url": "https://www.youtube.com/watch?v=other", "title": "Angèle - Une seule vie (Official Video)", "channel": "Angèle", "duration": 249.0 },
        ]});
        assert_eq!(best_match("Flemme", "Angèle", 256.1, &search).as_deref(), Some("https://www.youtube.com/watch?v=audio"));
    }

    #[test]
    fn ecarte_une_duree_incoherente() {
        assert!(score("Flemme", "Angèle", 256.0, "Angèle - Flemme", "Angèle", Some(3600.0)).is_none());
    }

    #[test]
    fn decode_le_base64() {
        assert_eq!(base64_decode("eyJhIjoxfQ==").unwrap(), br#"{"a":1}"#);
    }
}
