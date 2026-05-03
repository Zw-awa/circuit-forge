export type SignalType =
  | { type: 'bit' }
  | { type: 'bus'; width: number }
  | { type: 'integer'; min: number; max: number }
  | { type: 'float'; min: number; max: number };

export type PropagationMode = 'event_driven' | 'tick_driven';

export type AttenuationModel =
  | { type: 'none' }
  | { type: 'linear'; lossPerUnit: number };

export type TickBehavior = 'synchronous' | 'asynchronous';

export interface RulePack {
  id: number;
  name: string;
  description: string;
  isPreset: boolean;
  signalType: SignalType;
  propagationMode: PropagationMode;
  attenuation: AttenuationModel;
  tickBehavior: TickBehavior;
  gateDelay: number;
}
