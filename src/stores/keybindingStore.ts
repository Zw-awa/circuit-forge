import { create } from 'zustand';
import {
  getKeybindings,
  setKeybinding,
  resetKeybindings,
  exportKeybindings,
  importKeybindings,
} from '../ipc/keybindingIpc';

export interface KeyBindingEntry {
  action: string;
  key: string;
  description: string;
}

interface KeybindingState {
  bindings: Map<string, string>; // action → key
  keyToAction: Map<string, string>; // key → action
  descriptions: Map<string, string>; // action → description
  loaded: boolean;

  loadBindings: () => Promise<void>;
  setBinding: (action: string, key: string) => Promise<void>;
  getKeyForAction: (action: string) => string | undefined;
  getActionForKey: (key: string) => string | undefined;
  getDescription: (action: string) => string;
  resetDefaults: () => Promise<void>;
  exportConfig: () => Promise<string>;
  importConfig: (json: string) => Promise<void>;
}

function normalizeKeyStr(key: string): string {
  return key.length === 1 ? key.toUpperCase() : key;
}

export const useKeybindingStore = create<KeybindingState>()((set, get) => ({
  bindings: new Map(),
  keyToAction: new Map(),
  descriptions: new Map(),
  loaded: false,

  loadBindings: async () => {
    try {
      const entries: KeyBindingEntry[] = await getKeybindings();
      const bindings = new Map<string, string>();
      const keyToAction = new Map<string, string>();
      const descriptions = new Map<string, string>();
      for (const e of entries) {
        const normalizedKey = normalizeKeyStr(e.key);
        bindings.set(e.action, normalizedKey);
        keyToAction.set(normalizedKey, e.action);
        descriptions.set(e.action, e.description);
      }
      set({ bindings, keyToAction, descriptions, loaded: true });
    } catch (err) {
      console.error('Failed to load keybindings:', err);
    }
  },

  setBinding: async (action: string, key: string) => {
    try {
      const normalizedKey = normalizeKeyStr(key);
      await setKeybinding(action, normalizedKey);
      set((state) => {
        const nextBindings = new Map(state.bindings);
        const oldKey = nextBindings.get(action);
        nextBindings.set(action, normalizedKey);

        const nextReverse = new Map(state.keyToAction);
        if (oldKey) nextReverse.delete(oldKey);
        nextReverse.set(normalizedKey, action);

        return { bindings: nextBindings, keyToAction: nextReverse };
      });
    } catch (err) {
      console.error('Failed to set keybinding:', err);
      throw err;
    }
  },

  getKeyForAction: (action: string) => {
    return get().bindings.get(action);
  },

  getActionForKey: (key: string) => {
    const normalized = normalizeKeyStr(key);
    return get().keyToAction.get(normalized);
  },

  getDescription: (action: string) => {
    return get().descriptions.get(action) || action;
  },

  resetDefaults: async () => {
    try {
      const entries: KeyBindingEntry[] = await resetKeybindings();
      const bindings = new Map<string, string>();
      const keyToAction = new Map<string, string>();
      const descriptions = new Map<string, string>();
      for (const e of entries) {
        const normalizedKey = normalizeKeyStr(e.key);
        bindings.set(e.action, normalizedKey);
        keyToAction.set(normalizedKey, e.action);
        descriptions.set(e.action, e.description);
      }
      set({ bindings, keyToAction, descriptions });
    } catch (err) {
      console.error('Failed to reset keybindings:', err);
      throw err;
    }
  },

  exportConfig: async () => {
    return await exportKeybindings();
  },

  importConfig: async (json: string) => {
    try {
      const entries: KeyBindingEntry[] = await importKeybindings(json);
      const bindings = new Map<string, string>();
      const keyToAction = new Map<string, string>();
      const descriptions = new Map<string, string>();
      for (const e of entries) {
        const normalizedKey = normalizeKeyStr(e.key);
        bindings.set(e.action, normalizedKey);
        keyToAction.set(normalizedKey, e.action);
        descriptions.set(e.action, e.description);
      }
      set({ bindings, keyToAction, descriptions });
    } catch (err) {
      console.error('Failed to import keybindings:', err);
      throw err;
    }
  },
}));
