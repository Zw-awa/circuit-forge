use tauri::State;
use crate::EngineState;
use crate::project;

#[tauri::command]
pub fn save_project(
    engine: State<'_, EngineState>,
) -> Result<String, String> {
    let eng = engine.lock().map_err(|e| e.to_string())?;
    project::save::save_project(&eng)
}

#[tauri::command]
pub fn load_project(
    engine: State<'_, EngineState>,
    json: String,
) -> Result<serde_json::Value, String> {
    let mut eng = engine.lock().map_err(|e| e.to_string())?;
    project::load::load_project(&mut eng, &json)?;

    Ok(serde_json::json!({
        "components": eng.graph.components.values().collect::<Vec<_>>(),
        "pins": eng.graph.pins.values().collect::<Vec<_>>(),
        "wires": eng.graph.wires.values().collect::<Vec<_>>(),
    }))
}
