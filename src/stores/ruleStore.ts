import { create } from 'zustand';
import type { RulePack } from '../types/rules';
import { getRulePacks, setActiveRulePack, updateCustomRulePack, deleteCustomRulePack } from '../ipc/simulationIpc';

interface RuleState {
  activeRulePackId: number;
  rulePacks: RulePack[];
  setActiveRulePack: (id: number) => Promise<void>;
  loadRulePacks: () => Promise<void>;
  updateCustomRulePack: (id: number, pack: Partial<RulePack>) => Promise<void>;
  deleteCustomRulePack: (id: number) => Promise<void>;
}

export const useRuleStore = create<RuleState>((set) => ({
  activeRulePackId: 3,
  rulePacks: [],
  setActiveRulePack: async (id) => {
    await setActiveRulePack(id);
    set({ activeRulePackId: id });
  },
  loadRulePacks: async () => {
    const packs = await getRulePacks();
    set({
      rulePacks: packs,
      activeRulePackId: packs.find((p) => p.id === 3)?.id ?? packs[0]?.id ?? 3,
    });
  },
  updateCustomRulePack: async (id, pack) => {
    await updateCustomRulePack(id, pack);
    await useRuleStore.getState().loadRulePacks();
  },
  deleteCustomRulePack: async (id) => {
    await deleteCustomRulePack(id);
    await useRuleStore.getState().loadRulePacks();
  },
}));
