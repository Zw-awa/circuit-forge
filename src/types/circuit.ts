export type ComponentKind =
  | 'And' | 'Or' | 'Not' | 'Nand' | 'Xor' | 'Switch' | 'Led'
  | 'Button' | 'Clock' | 'Random' | 'Constant'
  | 'SevenSegment' | 'Oscilloscope'
  | 'DelayLine' | 'Splitter' | 'Merger';

export interface CircuitComponent {
  id: number;
  kind: ComponentKind;
  x: number;
  y: number;
  inputPins: number[];
  outputPins: number[];
  toggleState?: Signal;
  // Phase 2 fields
  pressState?: boolean;
  clockPeriod?: number;
  clockDuty?: number;
  randomProbability?: number;
  constantValue?: Signal;
  oscilloscopeChannels?: number;
  oscilloscopeTimeWindow?: number;
  delayTicks?: number;
  busWidth?: number;
}

export interface Pin {
  id: number;
  ownerId: number;
  isOutput: boolean;
  offsetX: number;
  offsetY: number;
  worldX: number;
  worldY: number;
  netId?: number;
}

export interface Junction {
  id: number;
  x: number;
  y: number;
  netId: number;
}

export type WireEndpoint = { type: 'pin'; id: number } | { type: 'junction'; id: number };

export interface Wire {
  id: number;
  start: WireEndpoint;
  end: WireEndpoint;
  netId: number;
  color?: number;
}

export type Signal = 'High' | 'Low' | 'Bus';
