use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use super::types::{ComponentId, ComponentKind, NetId, PinId, WireId, Signal};
use super::component::Component;
use super::pin::Pin;
use super::wire::{Wire, WireEndpoint};
use super::junction::Junction;

#[derive(Clone, Serialize, Deserialize)]
pub struct CircuitGraph {
    pub components: HashMap<ComponentId, Component>,
    pub pins: HashMap<PinId, Pin>,
    pub wires: HashMap<WireId, Wire>,
    pub nets: HashMap<NetId, Vec<PinId>>,
    pub junctions: HashMap<u32, Junction>,
    pub next_id: u32,
}

impl CircuitGraph {
    pub fn new() -> Self {
        Self {
            components: HashMap::new(),
            pins: HashMap::new(),
            wires: HashMap::new(),
            nets: HashMap::new(),
            junctions: HashMap::new(),
            next_id: 0,
        }
    }

    fn alloc_id(&mut self) -> u32 {
        let id = self.next_id;
        self.next_id += 1;
        id
    }

    pub fn add_component(
        &mut self,
        kind: ComponentKind,
        x: f32,
        y: f32,
    ) -> (ComponentId, Vec<PinId>, Vec<PinId>) {
        let comp_id = self.alloc_id();

        let (input_offsets, output_offsets): (Vec<(f32, f32)>, Vec<(f32, f32)>) = match kind {
            ComponentKind::And | ComponentKind::Or | ComponentKind::Nand | ComponentKind::Xor => {
                (vec![(-1.0, 0.3), (-1.0, -0.3)], vec![(1.0, 0.0)])
            }
            ComponentKind::Not => {
                (vec![(-1.0, 0.0)], vec![(1.0, 0.0)])
            }
            ComponentKind::Switch => {
                (vec![], vec![(1.0, 0.0)])
            }
            ComponentKind::Led => {
                (vec![(-1.0, 0.0)], vec![])
            }
            ComponentKind::Button => {
                (vec![], vec![(1.0, 0.0)])
            }
            ComponentKind::Clock => {
                (vec![], vec![(1.0, 0.0)])
            }
            ComponentKind::Random => {
                (vec![], vec![(1.0, 0.0)])
            }
            ComponentKind::Constant => {
                (vec![], vec![(1.0, 0.0)])
            }
            ComponentKind::SevenSegment => {
                (
                    vec![
                        (-1.0, 0.45),
                        (-1.0, 0.15),
                        (-1.0, -0.15),
                        (-1.0, -0.45),
                    ],
                    vec![],
                )
            }
            ComponentKind::Oscilloscope => {
                (vec![(-1.0, 0.0)], vec![])
            }
            ComponentKind::DelayLine => {
                (vec![(-1.0, 0.0)], vec![(1.0, 0.0)])
            }
            ComponentKind::Splitter => {
                let width = 4_u32;
                let mut outputs = Vec::new();
                let spacing = 0.8 / width.max(1) as f32;
                let start_y = -0.4;
                for i in 0..width {
                    outputs.push((1.0, start_y + spacing * i as f32));
                }
                (vec![(-1.0, 0.0)], outputs)
            }
            ComponentKind::Merger => {
                let width = 4_u32;
                let mut inputs = Vec::new();
                let spacing = 0.8 / width.max(1) as f32;
                let start_y = -0.4;
                for i in 0..width {
                    inputs.push((-1.0, start_y + spacing * i as f32));
                }
                (inputs, vec![(1.0, 0.0)])
            }
        };

        let mut input_pins = Vec::new();
        let mut output_pins = Vec::new();

        for &(ox, oy) in &input_offsets {
            let pin_id = self.alloc_id();
            self.pins.insert(
                pin_id,
                Pin {
                    id: pin_id,
                    owner: comp_id,
                    is_output: false,
                    net: None,
                    offset_x: ox,
                    offset_y: oy,
                },
            );
            input_pins.push(pin_id);
        }

        for &(ox, oy) in &output_offsets {
            let pin_id = self.alloc_id();
            self.pins.insert(
                pin_id,
                Pin {
                    id: pin_id,
                    owner: comp_id,
                    is_output: true,
                    net: None,
                    offset_x: ox,
                    offset_y: oy,
                },
            );
            output_pins.push(pin_id);
        }

        let toggle_state = if kind == ComponentKind::Switch {
            Some(Signal::Low)
        } else {
            None
        };

        self.components.insert(
            comp_id,
            Component {
                id: comp_id,
                kind,
                x,
                y,
                input_pins: input_pins.clone(),
                output_pins: output_pins.clone(),
                toggle_state,
                press_state: None,
                clock_period: Some(2),
                clock_duty: Some(0.5),
                clock_counter: Some(0),
                random_probability: Some(0.5),
                constant_value: if kind == ComponentKind::Constant {
                    Some(Signal::High)
                } else {
                    None
                },
                oscilloscope_channels: Some(1),
                oscilloscope_time_window: Some(100),
                delay_ticks: Some(1),
                delay_buffer: None,
                bus_width: if kind == ComponentKind::Splitter || kind == ComponentKind::Merger {
                    Some(4)
                } else {
                    Some(1)
                },
            },
        );

        (comp_id, input_pins, output_pins)
    }

    pub fn add_junction(&mut self, x: f32, y: f32, net_id: NetId) -> u32 {
        let id = self.alloc_id();
        self.junctions.insert(
            id,
            Junction {
                id,
                x,
                y,
                net_id,
            },
        );
        id
    }

    pub fn remove_junction(&mut self, id: u32) -> Result<(), String> {
        self.junctions
            .remove(&id)
            .ok_or_else(|| format!("junction {} not found", id))?;

        let junction_id = id;
        let wires_to_remove: Vec<WireId> = self
            .wires
            .iter()
            .filter(|(_, w)| {
                matches!(&w.start, WireEndpoint::Junction(j) if *j == junction_id)
                    || matches!(&w.end, WireEndpoint::Junction(j) if *j == junction_id)
            })
            .map(|(wid, _)| *wid)
            .collect();

        for wire_id in wires_to_remove {
            let wire = self.wires.remove(&wire_id).unwrap();
            let pin_ids: Vec<Option<PinId>> = vec![wire.start.as_pin(), wire.end.as_pin()];
            for pin_id in pin_ids.iter().flatten() {
                let has_other = self.wires.values().any(|w| {
                    w.start.as_pin() == Some(*pin_id) || w.end.as_pin() == Some(*pin_id)
                });
                if !has_other {
                    self.clear_pin_from_net(*pin_id, wire.net_id);
                }
            }
        }

        Ok(())
    }

    pub fn add_wire(&mut self, start: WireEndpoint, end: WireEndpoint) -> Result<(WireId, NetId), String> {
        match (&start, &end) {
            (WireEndpoint::Pin(pa), WireEndpoint::Pin(pb)) => {
                let pa_pin = self.pins.get(pa).ok_or_else(|| format!("pin {} not found", pa))?;
                let pb_pin = self.pins.get(pb).ok_or_else(|| format!("pin {} not found", pb))?;
                if pa_pin.is_output == pb_pin.is_output {
                    return Err("cannot connect two input pins or two output pins".into());
                }
            }
            (WireEndpoint::Pin(pa), WireEndpoint::Junction(jb)) => {
                self.pins.get(pa).ok_or_else(|| format!("pin {} not found", pa))?;
                self.junctions.get(jb).ok_or_else(|| format!("junction {} not found", jb))?;
            }
            (WireEndpoint::Junction(ja), WireEndpoint::Pin(pb)) => {
                self.junctions.get(ja).ok_or_else(|| format!("junction {} not found", ja))?;
                self.pins.get(pb).ok_or_else(|| format!("pin {} not found", pb))?;
            }
            (WireEndpoint::Junction(ja), WireEndpoint::Junction(jb)) => {
                self.junctions.get(ja).ok_or_else(|| format!("junction {} not found", ja))?;
                self.junctions.get(jb).ok_or_else(|| format!("junction {} not found", jb))?;
            }
        }

        let net_a = match &start {
            WireEndpoint::Pin(pid) => self.pins.get(pid).and_then(|p| p.net),
            WireEndpoint::Junction(jid) => self.junctions.get(jid).map(|j| j.net_id),
        };
        let net_b = match &end {
            WireEndpoint::Pin(pid) => self.pins.get(pid).and_then(|p| p.net),
            WireEndpoint::Junction(jid) => self.junctions.get(jid).map(|j| j.net_id),
        };

        let net_id = match (net_a, net_b) {
            (Some(na), Some(nb)) if na == nb => {
                return Err("pins already on the same net".into());
            }
            (Some(na), Some(nb)) => {
                let pins_to_move: Vec<PinId> =
                    self.nets.get(&nb).cloned().unwrap_or_default();
                self.nets.remove(&nb);
                for pid in &pins_to_move {
                    if let Some(pin) = self.pins.get_mut(pid) {
                        pin.net = Some(na);
                    }
                }
                if let Some(net_pins) = self.nets.get_mut(&na) {
                    net_pins.extend(pins_to_move);
                }
                na
            }
            (Some(na), None) => {
                if let WireEndpoint::Pin(pid) = &end {
                    if let Some(net_pins) = self.nets.get_mut(&na) {
                        net_pins.push(*pid);
                    }
                }
                na
            }
            (None, Some(nb)) => {
                if let WireEndpoint::Pin(pid) = &start {
                    if let Some(net_pins) = self.nets.get_mut(&nb) {
                        net_pins.push(*pid);
                    }
                }
                nb
            }
            (None, None) => {
                let new_net = self.alloc_id();
                let mut net_pins = Vec::new();
                if let WireEndpoint::Pin(pid) = &start { net_pins.push(*pid); }
                if let WireEndpoint::Pin(pid) = &end { net_pins.push(*pid); }
                self.nets.insert(new_net, net_pins);
                new_net
            }
        };

        if let WireEndpoint::Pin(pid) = &start {
            if let Some(pin) = self.pins.get_mut(pid) { pin.net = Some(net_id); }
        }
        if let WireEndpoint::Pin(pid) = &end {
            if let Some(pin) = self.pins.get_mut(pid) { pin.net = Some(net_id); }
        }

        let wire_id = self.alloc_id();
        self.wires.insert(
            wire_id,
            Wire {
                id: wire_id,
                start: start.clone(),
                end: end.clone(),
                net_id,
                color: None,
            },
        );

        Ok((wire_id, net_id))
    }

    pub fn remove_component(&mut self, comp_id: ComponentId) -> Result<(), String> {
        let all_pins: Vec<PinId> = {
            let comp = self
                .components
                .get(&comp_id)
                .ok_or("component not found")?;
            comp.input_pins
                .iter()
                .chain(comp.output_pins.iter())
                .copied()
                .collect()
        };

        let wires_to_remove: Vec<WireId> = self
            .wires
            .iter()
            .filter(|(_, w)| {
                w.start.as_pin().map_or(false, |p| all_pins.contains(&p))
                    || w.end.as_pin().map_or(false, |p| all_pins.contains(&p))
            })
            .map(|(id, _)| *id)
            .collect();

        for wire_id in &wires_to_remove {
            let wire = self.wires.remove(wire_id).unwrap();
            let pin_ids: Vec<Option<PinId>> = vec![wire.start.as_pin(), wire.end.as_pin()];
            for pin_id in pin_ids.iter().flatten() {
                let has_other = self.wires.values().any(|w| {
                    w.start.as_pin() == Some(*pin_id) || w.end.as_pin() == Some(*pin_id)
                });
                if !has_other {
                    self.clear_pin_from_net(*pin_id, wire.net_id);
                }
            }
        }

        for pin_id in &all_pins {
            self.pins.remove(pin_id);
        }

        self.components.remove(&comp_id);

        Ok(())
    }

    pub fn remove_wire(&mut self, wire_id: WireId) -> Result<(), String> {
        let wire = self.wires.remove(&wire_id).ok_or("wire not found")?;
        let pin_ids: Vec<Option<PinId>> = vec![wire.start.as_pin(), wire.end.as_pin()];
        for pin_id in pin_ids.iter().flatten() {
            let has_other = self.wires.values().any(|w| {
                w.start.as_pin() == Some(*pin_id) || w.end.as_pin() == Some(*pin_id)
            });
            if !has_other {
                self.clear_pin_from_net(*pin_id, wire.net_id);
            }
        }
        Ok(())
    }

    fn clear_pin_from_net(&mut self, pin_id: PinId, net_id: NetId) {
        let is_empty = if let Some(net_pins) = self.nets.get_mut(&net_id) {
            net_pins.retain(|&p| p != pin_id);
            net_pins.is_empty()
        } else {
            false
        };
        if is_empty {
            self.nets.remove(&net_id);
        }
        if let Some(pin) = self.pins.get_mut(&pin_id) {
            pin.net = None;
        }
    }

    pub fn move_component(
        &mut self,
        comp_id: ComponentId,
        x: f32,
        y: f32,
    ) -> Result<(), String> {
        let comp = self
            .components
            .get_mut(&comp_id)
            .ok_or("component not found")?;
        comp.x = x;
        comp.y = y;
        Ok(())
    }
}
