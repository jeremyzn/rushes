use crate::models::DownloadTask;
use parking_lot::Mutex;
use std::{collections::HashMap, sync::Arc};
use tokio::process::Child;

#[derive(Clone)]
pub struct AppState {
    pub tasks: Arc<Mutex<Vec<DownloadTask>>>,
    pub children: Arc<Mutex<HashMap<String, Child>>>,
    pub scheduler: Arc<tokio::sync::Mutex<()>>,
}
impl Default for AppState {
    fn default() -> Self { Self { tasks: Arc::new(Mutex::new(Vec::new())), children: Arc::new(Mutex::new(HashMap::new())), scheduler: Arc::new(tokio::sync::Mutex::new(())) } }
}
