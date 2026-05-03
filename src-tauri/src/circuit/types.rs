use serde::{Deserialize, Serialize};

pub type ComponentId = u32;
pub type PinId = u32;
pub type WireId = u32;
pub type NetId = u32;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum Signal {
    Low,
    High,
    Bus(u8),
}

impl Signal {
    pub fn is_high(&self) -> bool {
        matches!(self, Signal::High | Signal::Bus(_))
    }
    pub fn is_low(&self) -> bool {
        matches!(self, Signal::Low)
    }
}

#[derive(Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SimMode {
    EventDriven,
    TickDriven,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum ComponentKind {
    // Phase 1 existing
    And,
    Or,
    Not,
    Nand,
    Xor,
    Switch,
    Led,
    // Phase 2 new
    Button,
    Clock,
    Random,
    Constant,
    SevenSegment,
    Oscilloscope,
    DelayLine,
    Splitter,
    Merger,
}

impl ComponentKind {
    #[allow(dead_code)]
    pub fn pin_counts(&self) -> (usize, usize) {
        match self {
            ComponentKind::And => (2, 1),
            ComponentKind::Or => (2, 1),
            ComponentKind::Not => (1, 1),
            ComponentKind::Nand => (2, 1),
            ComponentKind::Xor => (2, 1),
            ComponentKind::Switch => (0, 1),
            ComponentKind::Led => (1, 0),
            ComponentKind::Button => (0, 1),
            ComponentKind::Clock => (0, 1),
            ComponentKind::Random => (0, 1),
            ComponentKind::Constant => (0, 1),
            ComponentKind::SevenSegment => (4, 0),
            ComponentKind::Oscilloscope => (1, 0),
            ComponentKind::DelayLine => (1, 1),
            ComponentKind::Splitter => (1, 4),
            ComponentKind::Merger => (4, 1),
        }
    }
}
