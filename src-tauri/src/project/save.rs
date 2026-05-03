use serde::{Deserialize, Serialize};
use crate::circuit::component::Component;
use crate::circuit::pin::Pin;
use crate::circuit::wire::Wire;
use crate::circuit::junction::Junction;
use crate::simulation::engine::SimulationEngine;

#[derive(Serialize, Deserialize)]
struct SaveData {
    version: u32,
    components: Vec<Component>,
    pins: Vec<Pin>,
    wires: Vec<Wire>,
    junctions: Vec<Junction>,
    next_id: u32,
    sim_mode: String,
    tick_rate: u32,
    speed_multiplier: f32,
}

pub fn save_project(engine: &SimulationEngine) -> Result<String, String> {
    let graph = &engine.graph;
    let sim_mode = match engine.sim_mode {
        crate::circuit::types::SimMode::EventDriven => "event",
        crate::circuit::types::SimMode::TickDriven => "tick",
    };
    let data = SaveData {
        version: 2,
        components: graph.components.values().cloned().collect(),
        pins: graph.pins.values().cloned().collect(),
        wires: graph.wires.values().cloned().collect(),
        junctions: graph.junctions.values().cloned().collect(),
        next_id: graph.next_id,
        sim_mode: sim_mode.to_string(),
        tick_rate: engine.tick_rate,
        speed_multiplier: engine.speed_multiplier,
    };
    serde_json::to_string(&data).map_err(|e| e.to_string())
}
