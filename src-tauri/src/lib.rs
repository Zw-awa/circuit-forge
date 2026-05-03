mod circuit;
mod simulation;
mod project;
mod commands;

use std::sync::{Arc, Mutex};
use simulation::engine::SimulationEngine;

type EngineState = Arc<Mutex<SimulationEngine>>;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(EngineState::new(Mutex::new(SimulationEngine::new())))
        .invoke_handler(tauri::generate_handler![
            commands::circuit_cmds::add_component,
            commands::circuit_cmds::remove_component,
            commands::circuit_cmds::move_component,
            commands::circuit_cmds::add_wire,
            commands::circuit_cmds::remove_wire,
            commands::circuit_cmds::add_junction,
            commands::circuit_cmds::remove_junction,
            commands::circuit_cmds::set_wire_color,
            commands::simulation_cmds::toggle_switch,
            commands::simulation_cmds::sim_step,
            commands::simulation_cmds::sim_start,
            commands::simulation_cmds::sim_pause,
            commands::simulation_cmds::sim_reset,
            commands::simulation_cmds::get_signals,
            commands::simulation_cmds::press_button,
            commands::simulation_cmds::release_button,
            commands::simulation_cmds::set_constant_value,
            commands::simulation_cmds::set_component_param,
            commands::simulation_cmds::set_sim_mode,
            commands::simulation_cmds::set_tick_rate,
            commands::simulation_cmds::set_sim_speed,
            commands::simulation_cmds::sim_step_n,
            commands::simulation_cmds::get_signal_history,
            commands::project_cmds::save_project,
            commands::project_cmds::load_project,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
