import { create } from 'zustand';
import type { Signal } from '../types/circuit';
import type { SimStatus, SimMode } from '../types/simulation';

interface SimulationState {
  signals: Map<number, Signal>;
  status: SimStatus;
  tickCount: number;
  mode: SimMode;
  tickRate: number;
  speedMultiplier: number;

  updateSignals: (changed: Record<string, string>) => void;
  setAllSignals: (signals: Map<number, Signal>) => void;
  setStatus: (status: SimStatus) => void;
  incrementTick: () => void;
  reset: () => void;
  setMode: (mode: SimMode) => void;
  setTickRate: (rate: number) => void;
  setSpeedMultiplier: (multiplier: number) => void;
}

const simulationStore = create<SimulationState>()((set) => ({
  signals: new Map(),
  status: 'stopped',
  tickCount: 0,
  mode: 'event',
  tickRate: 10,
  speedMultiplier: 1.0,

  updateSignals: (changed) =>
    set((state) => {
      const next = new Map(state.signals);
      for (const [netIdStr, signal] of Object.entries(changed)) {
        const netId = parseInt(netIdStr, 10);
        if (!isNaN(netId)) {
          next.set(netId, signal as Signal);
        }
      }
      return { signals: next };
    }),

  setAllSignals: (signals) => set({ signals }),

  setStatus: (status) => set({ status }),

  incrementTick: () => set((state) => ({ tickCount: state.tickCount + 1 })),

  reset: () => set({ signals: new Map(), status: 'stopped', tickCount: 0 }),

  setMode: (mode) => set({ mode }),

  setTickRate: (rate) => set({ tickRate: rate }),

  setSpeedMultiplier: (multiplier) => set({ speedMultiplier: multiplier }),
}));

export const useSimulationStore = simulationStore;
export { simulationStore };
