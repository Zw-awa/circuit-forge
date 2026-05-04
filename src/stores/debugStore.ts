import { create } from 'zustand';
import type { Breakpoint, BreakpointHitInfo } from '../types/debug';

interface DebugState {
  breakpoints: Breakpoint[];
  activeBreakpointHit: BreakpointHitInfo | null;
  isDebugging: boolean;

  setBreakpoints: (bps: Breakpoint[]) => void;
  addBreakpoint: (bp: Breakpoint) => void;
  removeBreakpoint: (id: number) => void;
  setBreakpointEnabled: (id: number, enabled: boolean) => void;
  setActiveBreakpointHit: (hit: BreakpointHitInfo | null) => void;
  setIsDebugging: (debugging: boolean) => void;
  reset: () => void;
}

const debugStore = create<DebugState>()((set) => ({
  breakpoints: [],
  activeBreakpointHit: null,
  isDebugging: false,

  setBreakpoints: (bps) => set({ breakpoints: bps }),

  addBreakpoint: (bp) =>
    set((state) => ({ breakpoints: [...state.breakpoints, bp] })),

  removeBreakpoint: (id) =>
    set((state) => ({
      breakpoints: state.breakpoints.filter((bp) => bp.id !== id),
    })),

  setBreakpointEnabled: (id, enabled) =>
    set((state) => ({
      breakpoints: state.breakpoints.map((bp) =>
        bp.id === id ? { ...bp, enabled } : bp
      ),
    })),

  setActiveBreakpointHit: (hit) => set({ activeBreakpointHit: hit }),

  setIsDebugging: (debugging) => set({ isDebugging: debugging }),

  reset: () => set({ breakpoints: [], activeBreakpointHit: null, isDebugging: false }),
}));

export const useDebugStore = debugStore;
export { debugStore };
