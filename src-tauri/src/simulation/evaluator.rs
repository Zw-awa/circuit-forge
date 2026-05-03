use crate::circuit::types::{ComponentKind, Signal};

pub fn evaluate_gate(kind: ComponentKind, inputs: &[Signal]) -> Signal {
    match kind {
        ComponentKind::And => {
            if inputs.iter().all(|s| *s == Signal::High) {
                Signal::High
            } else {
                Signal::Low
            }
        }
        ComponentKind::Or => {
            if inputs.iter().any(|s| *s == Signal::High) {
                Signal::High
            } else {
                Signal::Low
            }
        }
        ComponentKind::Not => match inputs.first() {
            Some(Signal::High) => Signal::Low,
            _ => Signal::High,
        },
        ComponentKind::Nand => {
            if inputs.iter().all(|s| *s == Signal::High) {
                Signal::Low
            } else {
                Signal::High
            }
        }
        ComponentKind::Xor => {
            let high_count = inputs.iter().filter(|s| **s == Signal::High).count();
            if high_count % 2 == 1 {
                Signal::High
            } else {
                Signal::Low
            }
        }
        ComponentKind::Switch => Signal::Low,
        ComponentKind::Led => Signal::Low,
        ComponentKind::Button => Signal::Low,
        ComponentKind::Clock => Signal::Low,
        ComponentKind::Random => Signal::Low,
        ComponentKind::Constant => Signal::Low,
        ComponentKind::SevenSegment => Signal::Low,
        ComponentKind::Oscilloscope => Signal::Low,
        ComponentKind::DelayLine => Signal::Low,
        ComponentKind::Splitter => Signal::Low,
        ComponentKind::Merger => Signal::Low,
    }
}
