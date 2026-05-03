export interface ExternalPin {
  name: string;
  isOutput: boolean;
  internalPinId: number;
  offsetX: number;
  offsetY: number;
}

export interface SubCircuitDef {
  id: number;
  name: string;
  description: string;
  externalPins: ExternalPin[];
  width: number;
  height: number;
  iconLabel: string;
}

export interface EnterSubCircuitData {
  components: import('./circuit').CircuitComponent[];
  wires: import('../ipc/simulationIpc').WireData[];
  pins: import('../ipc/simulationIpc').PinData[];
  defName: string;
}
