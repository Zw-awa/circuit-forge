import { create } from 'zustand';
import type { SignalJson } from '../ipc/debugIpc';

export interface WaveformPoint {
  tick: number;
  signal: SignalJson;
}

export interface WaveformState {
  monitoredNets: number[];
  waveformData: Map<number, WaveformPoint[]>;
  cursorTick: number | null;
  timeWindow: [number, number] | null;
  autoScroll: boolean;
  zoomLevel: number;

  addNet: (netId: number) => void;
  removeNet: (netId: number) => void;
  appendData: (netId: number, tick: number, signal: SignalJson) => void;
  fetchHistory: (netIds: number[]) => Promise<void>;
  setCursorTick: (tick: number | null) => void;
  setTimeWindow: (range: [number, number] | null) => void;
  toggleAutoScroll: () => void;
  setZoom: (level: number) => void;
  scrollToEnd: (drawWidth: number, simTickCount: number) => number;
  exportCsv: (netIds: number[]) => Promise<string>;
  clear: () => void;
}

const MAX_POINTS_PER_NET = 8192;

const waveformStore = create<WaveformState>()((set, get) => ({
  monitoredNets: [],
  waveformData: new Map(),
  cursorTick: null,
  timeWindow: null,
  autoScroll: true,
  zoomLevel: 8,

  addNet: (netId) =>
    set((state) => {
      if (state.monitoredNets.includes(netId)) return state;
      return { monitoredNets: [...state.monitoredNets, netId] };
    }),

  removeNet: (netId) =>
    set((state) => {
      const next = new Map(state.waveformData);
      next.delete(netId);
      return {
        monitoredNets: state.monitoredNets.filter((n) => n !== netId),
        waveformData: next,
      };
    }),

  appendData: (netId, tick, signal) =>
    set((state) => {
      if (!state.monitoredNets.includes(netId)) return state;
      const next = new Map(state.waveformData);
      const existing = next.get(netId) || [];
      const last = existing[existing.length - 1];
      if (last && last.tick === tick) {
        existing[existing.length - 1] = { tick, signal };
        return { waveformData: next };
      }
      const updated = [...existing, { tick, signal }];
      if (updated.length > MAX_POINTS_PER_NET) {
        updated.splice(0, updated.length - MAX_POINTS_PER_NET);
      }
      next.set(netId, updated);
      return { waveformData: next };
    }),

  fetchHistory: async (netIds) => {
    const { getBulkSignalHistory } = await import('../ipc/debugIpc');
    const result = await getBulkSignalHistory(netIds);
    for (const [netIdStr, entries] of Object.entries(result)) {
      const netId = parseInt(netIdStr, 10);
      for (const [tick, signal] of entries) {
        get().appendData(netId, tick, signal);
      }
    }
  },

  setCursorTick: (tick) => set({ cursorTick: tick }),
  setTimeWindow: (range) => set({ timeWindow: range }),
  toggleAutoScroll: () => set((s) => ({ autoScroll: !s.autoScroll })),

  setZoom: (level) => set({ zoomLevel: Math.max(1, Math.min(64, level)) }),

  scrollToEnd: (drawWidth, simTickCount) => {
    const { zoomLevel } = get();
    if (drawWidth <= 0) return 0;
    const visibleTicks = drawWidth / zoomLevel;
    return Math.max(0, simTickCount - visibleTicks);
  },

  exportCsv: async (netIds) => {
    const { exportWaveformCsv } = await import('../ipc/debugIpc');
    return exportWaveformCsv(netIds);
  },

  clear: () =>
    set({
      monitoredNets: [],
      waveformData: new Map(),
      cursorTick: null,
      timeWindow: null,
    }),
}));

export const useWaveformStore = waveformStore;
export { waveformStore };
