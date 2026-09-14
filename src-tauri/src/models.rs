use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QualityOption {
    pub id: String,
    pub label: String,
    pub detail: Option<String>,
    pub height: Option<u64>,
    pub fps: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaInfo {
    pub url: String,
    pub provider: String,
    pub media_type: String,
    pub id: String,
    pub title: String,
    pub author: String,
    pub category: String,
    pub duration: f64,
    pub thumbnail: String,
    pub is_live: bool,
    pub qualities: Vec<QualityOption>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct DownloadRequest {
    pub url: String,
    pub provider: String,
    pub title: String,
    pub author: String,
    pub thumbnail: Option<String>,
    pub quality: String,
    pub media_type: String,
    pub speed_profile: String,
    pub mode: String,
    pub audio_format: Option<String>,
    pub container: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default, rename_all = "camelCase")]
pub struct DownloadTask {
    pub id: String,
    pub url: String,
    pub provider: String,
    pub title: String,
    pub author: String,
    pub thumbnail: Option<String>,
    pub quality: String,
    pub mode: String,
    pub state: String,
    pub progress: f64,
    pub speed_bps: f64,
    pub downloaded_bytes: u64,
    pub total_bytes: Option<u64>,
    pub eta_seconds: Option<u64>,
    pub engine: Option<String>,
    pub error: Option<String>,
    pub output_path: Option<String>,
    pub created_at: String,
    pub media_type: String,
    #[serde(default)]
    pub request: DownloadRequest,
    #[serde(skip)]
    pub pid: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Settings {
    pub output_dir: String,
    pub theme: String,
    pub reduced_motion: bool,
    pub quality: String,
    pub speed_profile: String,
    pub concurrent_downloads: u8,
    pub smart_fallback: bool,
    pub download_metadata: bool,
    pub download_thumbnail: bool,
    pub notifications: bool,
    pub auto_check_updates: bool,
    pub auto_update_engines: bool,
    pub container: String,
    pub audio_format: String,
    pub cookies_browser: String,
}

impl Default for Settings {
    fn default() -> Self {
        let output = dirs::download_dir()
            .unwrap_or_else(|| std::path::PathBuf::from("."))
            .join("Rushes");
        Self {
            output_dir: output.to_string_lossy().to_string(),
            theme: "dark".into(), reduced_motion: false, quality: "best".into(), speed_profile: "auto".into(),
            concurrent_downloads: 2, smart_fallback: true, download_metadata: true, download_thumbnail: true,
            notifications: true, auto_check_updates: true, auto_update_engines: true, container: "auto".into(), audio_format: "m4a".into(),
            cookies_browser: "none".into(),
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineStatus {
    pub name: String,
    pub version: String,
    pub available: bool,
    pub path: Option<String>,
    pub bundled: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NetworkStatus {
    pub online: bool,
    pub latency_ms: Option<u128>,
    pub checked_at: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeInfo {
    pub os: String,
    pub arch: String,
    pub version: String,
    /// Faux en développement : l'updater n'est configuré que dans les builds de release.
    pub updater_enabled: bool,
}
