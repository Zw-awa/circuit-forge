use serde::Deserialize;
use crate::circuit::component::Component;
use crate::circuit::pin::Pin;
use crate::circuit::wire::Wire;
use crate::circuit::junction::Junction;
use crate::circuit::types::SimMode;
use crate::simulation::engine::SimulationEngine;

#[derive(Deserialize)]
struct LoadData {
    version: u32,
    components: Vec<Component>,
    pins: Vec<Pin>,
    wires: Vec<Wire>,
    #[serde(default)]
    junctions: Vec<Junction>,
    next_id: u32,
    #[serde(default)]
    sim_mode: Option<String>,
    #[serde(default)]
    tick_rate: Option<u32>,
    #[serde(default)]
    speed_multiplier: Option<f32>,
}

pub fn load_project(engine: &mut SimulationEngine, json: &str) -> Result<(), String> {
    let data: LoadData = serde_json::from_str(json).map_err(|e| e.to_string())?;
    if data.version < 1 || data.version > 2 {
        return Err(format!("unsupported version: {}", data.version));
    }

    let graph = &mut engine.graph;
    graph.components.clear();
    graph.pins.clear();
    graph.wires.clear();
    graph.nets.clear();
    graph.junctions.clear();
    graph.next_id = data.next_id;

    engine.signals.clear();
    engine.event_queue.clear();
    engine.tick_engine.reset();
    engine.signal_history.clear();

    for comp in data.components {
        graph.components.insert(comp.id, comp);
    }
    for pin in data.pins {
        graph.pins.insert(pin.id, pin);
    }
    for wire in data.wires {
        graph.wires.insert(wire.id, wire);
    }
    for junction in data.junctions {
        graph.junctions.insert(junction.id, junction);
    }

    for (pin_id, pin) in &graph.pins {
        if let Some(net_id) = pin.net {
            graph
                .nets
                .entry(net_id)
                .or_insert_with(Vec::new)
                .push(*pin_id);
        }
    }

    engine.sim_mode = match data.sim_mode.as_deref() {
        Some("tick") => SimMode::TickDriven,
        _ => SimMode::EventDriven,
    };
    engine.tick_rate = data.tick_rate.unwrap_or(10);
    engine.speed_multiplier = data.speed_multiplier.unwrap_or(1.0);

    Ok(())
}
