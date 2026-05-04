mod circuit;
mod simulation;
mod project;
mod commands;
mod rules;
mod scripting;
mod verification;
mod skin;
mod packaging;
mod debugging;

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
            commands::simulation_cmds::get_rule_packs,
            commands::simulation_cmds::set_active_rule_pack,
            commands::simulation_cmds::create_custom_rule_pack,
            commands::simulation_cmds::delete_custom_rule_pack,
            commands::project_cmds::save_project,
            commands::project_cmds::load_project,
            commands::project_cmds::export_custom_component,
            commands::project_cmds::import_custom_component,
            commands::project_cmds::export_rule_pack,
            commands::project_cmds::import_rule_pack,
            commands::custom_cmds::create_subcircuit_def,
            commands::custom_cmds::update_subcircuit_def,
            commands::custom_cmds::delete_subcircuit_def,
            commands::custom_cmds::get_subcircuit_defs,
            commands::custom_cmds::add_subcircuit_instance,
            commands::custom_cmds::enter_subcircuit,
            commands::custom_cmds::exit_subcircuit,
            commands::custom_cmds::get_lua_component_defs,
            commands::custom_cmds::create_lua_component_def,
            commands::custom_cmds::update_lua_component_def,
            commands::custom_cmds::delete_lua_component_def,
            commands::custom_cmds::add_lua_component_instance,
            commands::custom_cmds::validate_lua_script,
            commands::custom_cmds::create_truth_table,
            commands::custom_cmds::update_truth_table,
            commands::custom_cmds::delete_truth_table,
            commands::custom_cmds::get_truth_table,
            commands::custom_cmds::verify_truth_table_cmd,
            commands::skin_cmds::load_skin_pack,
            commands::skin_cmds::get_active_skin,
            commands::skin_cmds::set_active_skin,
            commands::skin_cmds::get_skin_asset,
            commands::skin_cmds::clear_skin,
            commands::skin_cmds::export_skin_pack,
            commands::packaging_cmds::export_circuitforge,
            commands::packaging_cmds::import_circuitforge,
            commands::packaging_cmds::create_snapshot_cmd,
            commands::packaging_cmds::list_snapshots,
            commands::packaging_cmds::restore_snapshot,
            commands::debug_cmds::add_breakpoint,
            commands::debug_cmds::remove_breakpoint,
            commands::debug_cmds::list_breakpoints,
            commands::debug_cmds::set_breakpoint_enabled,
            commands::debug_cmds::debug_step_into,
            commands::debug_cmds::debug_step_over,
            commands::debug_cmds::debug_continue,
            commands::debug_cmds::get_bulk_signal_history,
            commands::debug_cmds::export_waveform_csv,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
