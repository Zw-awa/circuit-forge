import { create } from 'zustand';
import type { SubCircuitDef } from '../types/subcircuit';
import { getSubCircuitDefs } from '../ipc/customComponentIpc';

interface CustomComponentState {
  subCircuitDefs: SubCircuitDef[];
  loadSubCircuitDefs: () => Promise<void>;
}

export const useCustomComponentStore = create<CustomComponentState>((set) => ({
  subCircuitDefs: [],
  loadSubCircuitDefs: async () => {
    const defs = await getSubCircuitDefs();
    set({ subCircuitDefs: defs });
  },
}));
