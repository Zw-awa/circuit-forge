export interface SnapshotInfo {
  id: number;
  name: string;
  created_at: string;
}

export interface ImportCircuitForgeSummary {
  success: boolean;
  componentCount: number;
  customComponentCount: number;
  rulePackCount: number;
  snapshotCount: number;
}

export interface ImportCircuitForgeResult {
  components: Array<{
    id: number;
    kind: string;
    x: number;
    y: number;
    inputPins: number[];
    outputPins: number[];
  }>;
  pins: Array<{
    id: number;
    owner: number;
    isOutput: boolean;
    offsetX: number;
    offsetY: number;
    net?: number;
  }>;
  wires: Array<{
    id: number;
    start: { Pin: number } | { Junction: number };
    end: { Pin: number } | { Junction: number };
    netId: number;
    color?: number;
  }>;
}
