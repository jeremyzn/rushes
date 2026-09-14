/*
   Prise en charge des liens Spotify.

   Spotify chiffre ses flux avec Widevine : aucun outil ne peut en extraire
   l'audio sans casser cette protection, ce que Rushes ne fait pas. On suit donc
   la même voie que spotDL : la page Spotify fournit le titre et l'artiste, et
   l'audio vient de YouTube via une recherche. Aucune clé d'API n'est requise,
   les métadonnées étant publiées dans les balises Open Graph de la page.
   */
use regex::Regex;
use std::sync::LazyLock;
use std::time::Duration;

static RE_KIND: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"open\.spotify\.com/(?:intl-[a-z]{2}/)?(track|album|playlist|episode|show)/").unwrap());
static RE_OG: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r#"<meta\s+property="og:(title|description)"\s+content="([^"]*)""#).unwrap());

/// Morceau reconnu sur un lien Spotify.
pub struct Track {
    pub title: String,
    pub artist: String,
    pub thumbnail: String,
}

pub fn is_spotify(url: &str) -> bool { url.to_lowercase().contains("open.spotify.com/") }

/// Type de ressource pointée par le lien, `None` si le lien n'est pas reconnu.
pub fn kind(url: &str) -> Option<&str> {
    RE_KIND.captures(&url.to_lowercase()).and_then(|c| c.get(1)).map(|m| match m.as_str() {
        "track" => "track", "album" => "album", "playlist" => "playlist",
        "episode" => "episode", _ => "show",
    })
}

fn decode_entities(raw: &str) -> String {
    raw.replace("&amp;", "&").replace("&quot;", "\"").replace("&#x27;", "'")
        .replace("&#39;", "'").replace("&lt;", "<").replace("&gt;", ">")
}

/// Lit les métadonnées publiques du lien. L'audio n'est jamais touché ici.
pub async fn resolve(url: &str) -> Result<Track, String> {
    match kind(url) {
        Some("track") => {}
        Some(other) => return Err(format!(
            "Les liens Spotify de type « {other} » ne sont pas encore pris en charge. Colle le lien d'un morceau.")),
        None => return Err("Lien Spotify non reconnu.".into()),
    }

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(20))
        .user_agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36")
        .build().map_err(|e| e.to_string())?;
    let page = client.get(url).send().await.map_err(|e| e.to_string())?;
    if !page.status().is_success() { return Err(format!("Spotify a refusé la page ({}).", page.status())) }
    let html = page.text().await.map_err(|e| e.to_string())?;

    let (mut title, mut description) = (String::new(), String::new());
    for capture in RE_OG.captures_iter(&html) {
        let value = decode_entities(&capture[2]);
        match &capture[1] { "title" => title = value, _ => description = value }
    }
    if title.is_empty() { return Err("Morceau introuvable sur cette page Spotify.".into()) }

    // og:description suit la forme « Artiste · Album · Song · 1987 ».
    let artist = description.split('·').next().unwrap_or("").trim().to_string();
    let thumbnail = Regex::new(r#"<meta\s+property="og:image"\s+content="([^"]*)""#).ok()
        .and_then(|re| re.captures(&html).map(|c| decode_entities(&c[1]))).unwrap_or_default();

    Ok(Track { title, artist, thumbnail })
}

/// Requête de recherche YouTube correspondant au morceau.
pub fn search_query(track: &Track) -> String {
    let terms = if track.artist.is_empty() { track.title.clone() } else { format!("{} {}", track.artist, track.title) };
    format!("ytsearch1:{terms} audio")
}
