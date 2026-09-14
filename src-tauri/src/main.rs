// Sans cet attribut, Windows ouvre une console noire à côté de la fenêtre en release.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main(){rushes_lib::run();}
