export type BreakpointTarget = { Net: number } | { Component: number };

export type SignalJson = string | { Bus: number } | { Integer: number } | { Float: number };
export type SignalLike = SignalJson | string;

export type BreakpointCondition =
  | { SignalEquals: SignalLike }
  | 'SignalChanges'
  | 'RisingEdge'
  | 'FallingEdge';

export interface Breakpoint {
  id: number;
  target: BreakpointTarget;
  condition: BreakpointCondition;
  enabled: boolean;
}

export interface BreakpointHitInfo {
  breakpointId: number;
  netId: number;
  oldSignal: SignalJson;
  newSignal: SignalJson;
}

export interface StepResult {
  changed: Record<string, SignalJson>;
  breakpointHit: BreakpointHitInfo | null;
  eventsRemaining: number;
}
