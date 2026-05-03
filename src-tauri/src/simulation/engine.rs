use std::collections::{HashMap, VecDeque};
use serde::{Deserialize, Serialize};
use crate::circuit::types::{ComponentKind, NetId, Signal, ComponentId, SimMode};
use crate::circuit::graph::CircuitGraph;
use super::evaluator::evaluate_gate;
use super::tick_engine::TickEngine;

const MAX_HISTORY_LENGTH: usize = 1024;

#[derive(Clone)]
pub struct SignalHistory {
    data: VecDeque<(u64, Signal)>,
    net_id: NetId,
}

impl SignalHistory {
    pub fn new(net_id: NetId) -> Self {
        Self {
            data: VecDeque::new(),
            net_id,
        }
    }
    pub fn record(&mut self, tick: u64, signal: Signal) {
        if self.data.len() >= MAX_HISTORY_LENGTH {
            self.data.pop_front();
        }
        self.data.push_back((tick, signal));
    }
    pub fn get_data(&self) -> &VecDeque<(u64, Signal)> {
        &self.data
    }
}

pub struct SimEvent {
    pub net_id: NetId,
    pub new_signal: Signal,
}

#[derive(Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SimStatus {
    Stopped,
    Running,
    Paused,
}

pub struct SimulationEngine {
    pub graph: CircuitGraph,
    pub signals: HashMap<NetId, Signal>,
    pub event_queue: VecDeque<SimEvent>,
    pub status: SimStatus,
    pub tick_count: u64,
    pub sim_mode: SimMode,
    pub tick_rate: u32,
    pub speed_multiplier: f32,
    pub signal_history: HashMap<NetId, SignalHistory>,
    pub tick_engine: TickEngine,
}

const MAX_EVENTS_PER_STEP: usize = 10_000;

impl SimulationEngine {
    pub fn new() -> Self {
        Self {
            graph: CircuitGraph::new(),
            signals: HashMap::new(),
            event_queue: VecDeque::new(),
            status: SimStatus::Stopped,
            tick_count: 0,
            sim_mode: SimMode::EventDriven,
            tick_rate: 10,
            speed_multiplier: 1.0,
            signal_history: HashMap::new(),
            tick_engine: TickEngine::new(),
        }
    }

    pub fn propagate(&mut self) -> HashMap<NetId, Signal> {
        let mut changed: HashMap<NetId, Signal> = HashMap::new();
        let mut iterations = 0;

        while let Some(event) = self.event_queue.pop_front() {
            if iterations >= MAX_EVENTS_PER_STEP {
                break;
            }
            iterations += 1;

            let old = self
                .signals
                .get(&event.net_id)
                .copied()
                .unwrap_or(Signal::Low);
            if old == event.new_signal {
                continue;
            }

            self.signals.insert(event.net_id, event.new_signal);
            changed.insert(event.net_id, event.new_signal);

            self.record_signal_history(event.net_id, event.new_signal);

            if let Some(pin_ids) = self.graph.nets.get(&event.net_id) {
                let pin_ids: Vec<_> = pin_ids.clone();
                for pin_id in pin_ids {
                    if let Some(pin) = self.graph.pins.get(&pin_id) {
                        if !pin.is_output {
                            self.evaluate_component(pin.owner);
                        }
                    }
                }
            }
        }

        self.tick_count += 1;
        changed
    }

    fn evaluate_component(&mut self, comp_id: ComponentId) {
        let comp = match self.graph.components.get(&comp_id) {
            Some(c) => c.clone(),
            None => return,
        };
        match comp.kind {
            ComponentKind::Switch
            | ComponentKind::Led
            | ComponentKind::Button
            | ComponentKind::Clock
            | ComponentKind::Random
            | ComponentKind::Constant
            | ComponentKind::SevenSegment
            | ComponentKind::Oscilloscope
            | ComponentKind::DelayLine => return,
            ComponentKind::Splitter => {
                let input_signal = comp.input_pins.iter()
                    .filter_map(|pid| self.graph.pins.get(pid))
                    .filter_map(|p| p.net)
                    .filter_map(|n| self.signals.get(&n).copied())
                    .next()
                    .unwrap_or(Signal::Low);
                let value = match input_signal {
                    Signal::Bus(v) => v,
                    Signal::High => 1,
                    Signal::Low => 0,
                };
                for (i, out_pin_id) in comp.output_pins.iter().enumerate() {
                    let bit_signal = if (value >> i) & 1 == 1 { Signal::High } else { Signal::Low };
                    if let Some(pin) = self.graph.pins.get(out_pin_id) {
                        if let Some(net_id) = pin.net {
                            let current = self.signals.get(&net_id).copied().unwrap_or(Signal::Low);
                            if current != bit_signal {
                                self.event_queue.push_back(SimEvent { net_id, new_signal: bit_signal });
                            }
                        }
                    }
                }
                return;
            }
            ComponentKind::Merger => {
                let mut value: u8 = 0;
                for (i, in_pin_id) in comp.input_pins.iter().enumerate() {
                    let sig = self.graph.pins.get(in_pin_id)
                        .and_then(|p| p.net)
                        .and_then(|n| self.signals.get(&n).copied())
                        .unwrap_or(Signal::Low);
                    if sig == Signal::High {
                        value |= 1 << i;
                    }
                }
                let output = Signal::Bus(value);
                for out_pin_id in &comp.output_pins {
                    if let Some(pin) = self.graph.pins.get(out_pin_id) {
                        if let Some(net_id) = pin.net {
                            let current = self.signals.get(&net_id).copied().unwrap_or(Signal::Low);
                            if current != output {
                                self.event_queue.push_back(SimEvent { net_id, new_signal: output });
                            }
                        }
                    }
                }
                return;
            }
            _ => {}
        }
        let inputs: Vec<Signal> = comp
            .input_pins
            .iter()
            .map(|pid| {
                self.graph
                    .pins
                    .get(pid)
                    .and_then(|p| p.net)
                    .and_then(|n| self.signals.get(&n).copied())
                    .unwrap_or(Signal::Low)
            })
            .collect();
        let output = evaluate_gate(comp.kind, &inputs);
        for out_pin_id in &comp.output_pins {
            if let Some(pin) = self.graph.pins.get(out_pin_id) {
                if let Some(net_id) = pin.net {
                    let current = self
                        .signals
                        .get(&net_id)
                        .copied()
                        .unwrap_or(Signal::Low);
                    if current != output {
                        self.event_queue.push_back(SimEvent {
                            net_id,
                            new_signal: output,
                        });
                    }
                }
            }
        }
    }

    pub fn toggle_switch(
        &mut self,
        comp_id: ComponentId,
    ) -> Result<HashMap<NetId, Signal>, String> {
        let comp = self
            .graph
            .components
            .get_mut(&comp_id)
            .ok_or("component not found")?;
        if comp.kind != ComponentKind::Switch {
            return Err("not a switch".into());
        }
        let new_state = match comp.toggle_state {
            Some(Signal::Low) => Signal::High,
            _ => Signal::Low,
        };
        comp.toggle_state = Some(new_state);
        let out_pins = comp.output_pins.clone();
        for out_pin_id in &out_pins {
            if let Some(pin) = self.graph.pins.get(out_pin_id) {
                if let Some(net_id) = pin.net {
                    self.event_queue.push_back(SimEvent {
                        net_id,
                        new_signal: new_state,
                    });
                }
            }
        }
        Ok(self.propagate())
    }

    pub fn step(&mut self) -> HashMap<NetId, Signal> {
        match self.sim_mode {
            SimMode::EventDriven => {
                self.advance_clocks();
                self.advance_randoms();
                self.advance_delay_lines();
                self.propagate()
            }
            SimMode::TickDriven => {
                self.tick_driven_step()
            }
        }
    }

    pub fn reset(&mut self) {
        self.signals.clear();
        self.event_queue.clear();
        self.tick_count = 0;
        self.status = SimStatus::Stopped;
        self.tick_engine.reset();
        for comp in self.graph.components.values_mut() {
            if comp.kind == ComponentKind::Switch {
                comp.toggle_state = Some(Signal::Low);
            }
            if comp.kind == ComponentKind::Constant {
                comp.constant_value = Some(Signal::Low);
            }
        }
    }

    pub fn get_signals(&self) -> &HashMap<NetId, Signal> {
        &self.signals
    }

    pub fn set_mode(&mut self, mode: SimMode) {
        match (self.sim_mode, mode) {
            (SimMode::EventDriven, SimMode::TickDriven) => {
                self.tick_engine.current_signals = self.signals.clone();
                self.tick_engine.next_signals = self.signals.clone();
            }
            (SimMode::TickDriven, SimMode::EventDriven) => {
                self.signals = self.tick_engine.current_signals.clone();
                self.event_queue.clear();
            }
            _ => {}
        }
        self.sim_mode = mode;
    }

    pub fn record_signal_history(&mut self, net_id: NetId, signal: Signal) {
        self.signal_history
            .entry(net_id)
            .or_insert_with(|| SignalHistory::new(net_id))
            .record(self.tick_count, signal);
    }

    pub fn advance_clocks(&mut self) {
        for (_, comp) in self.graph.components.iter_mut() {
            if comp.kind != ComponentKind::Clock {
                continue;
            }
            let period = comp.clock_period.unwrap_or(2);
            let mut counter = comp.clock_counter.unwrap_or(0);
            counter = (counter + 1) % period;
            let high_ticks = (period as f32 * comp.clock_duty.unwrap_or(0.5)) as u32;
            let new_signal = if counter < high_ticks {
                Signal::High
            } else {
                Signal::Low
            };
            comp.clock_counter = Some(counter);
            for out_pin_id in comp.output_pins.clone() {
                if let Some(pin) = self.graph.pins.get(&out_pin_id) {
                    if let Some(net_id) = pin.net {
                        self.event_queue.push_back(SimEvent {
                            net_id,
                            new_signal,
                        });
                    }
                }
            }
        }
    }

    pub fn advance_randoms(&mut self) {
        let tick = self.tick_count;
        for (_, comp) in self.graph.components.iter_mut() {
            if comp.kind != ComponentKind::Random {
                continue;
            }
            let prob = comp.random_probability.unwrap_or(0.5);
            let val = ((tick.wrapping_mul(comp.id as u64)) % 100) as f32 / 100.0;
            let signal = if val < prob {
                Signal::High
            } else {
                Signal::Low
            };
            for out_pin_id in &comp.output_pins {
                if let Some(pin) = self.graph.pins.get(out_pin_id) {
                    if let Some(net_id) = pin.net {
                        self.event_queue.push_back(SimEvent {
                            net_id,
                            new_signal: signal,
                        });
                    }
                }
            }
        }
    }

    pub fn tick_driven_step(&mut self) -> HashMap<NetId, Signal> {
        let changed = self.tick_engine.tick(&self.graph);
        self.tick_count += 1;
        self.signals = self.tick_engine.current_signals.clone();
        changed
    }

    pub fn advance_delay_lines(&mut self) {
        for (_, comp) in self.graph.components.iter_mut() {
            if comp.kind != ComponentKind::DelayLine {
                continue;
            }
            let delay = comp.delay_ticks.unwrap_or(1) as usize;
            let input = comp
                .input_pins
                .iter()
                .filter_map(|pid| self.graph.pins.get(pid))
                .filter_map(|p| p.net)
                .filter_map(|nid| self.signals.get(&nid).copied())
                .next()
                .unwrap_or(Signal::Low);
            let buffer = comp
                .delay_buffer
                .get_or_insert_with(|| VecDeque::from(vec![Signal::Low; delay]));
            buffer.push_back(input);
            let output = buffer.pop_front().unwrap_or(Signal::Low);
            let out_pins = comp.output_pins.clone();
            for out_pin_id in &out_pins {
                if let Some(pin) = self.graph.pins.get(out_pin_id) {
                    if let Some(net_id) = pin.net {
                        self.event_queue.push_back(SimEvent {
                            net_id,
                            new_signal: output,
                        });
                    }
                }
            }
        }
    }
}
