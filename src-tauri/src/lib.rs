mod commands;mod models;mod spotify;mod state;mod tools;
use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run(){
    tauri::Builder::default()
      .plugin(tauri_plugin_process::init())
      .plugin(tauri_plugin_dialog::init())
      .plugin(tauri_plugin_opener::init())
      .plugin(tauri_plugin_os::init())
      .plugin(tauri_plugin_notification::init())
      .manage(AppState::default())
      .invoke_handler(tauri::generate_handler![commands::analyze_url,commands::start_download,commands::list_downloads,commands::task_action,commands::remove_task,commands::clear_finished,commands::load_settings,commands::save_settings,commands::engine_status,commands::update_engines,commands::install_js_runtime,commands::remove_js_runtime,commands::network_status,commands::runtime_info])
      .setup(|app|{
        // La config `plugins.updater` n'existe qu'en release (tauri.release.conf.json) : sans elle le plugin panique au démarrage.
        if app.config().plugins.0.contains_key("updater") { app.handle().plugin(tauri_plugin_updater::Builder::new().build())?; }
        tools::install_bundled_engines(app.handle()).map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?; Ok(())})
      .run(tauri::generate_context!()).expect("error while running Rushes");
}
