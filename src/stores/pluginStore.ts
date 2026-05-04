import { create } from 'zustand';
import type { PluginInfo, ComponentRegistration, MenuItem, ExportFormat } from '../types/plugin';
import {
  pluginList,
  pluginLoad,
  pluginUnload,
  pluginSetEnabled,
  pluginGetComponents,
  pluginGetMenuItems,
  pluginGetExportFormats,
} from '../ipc/pluginIpc';

interface PluginState {
  plugins: PluginInfo[];
  /** Registrations keyed by plugin_id */
  pluginComponents: Record<string, ComponentRegistration[]>;
  /** Menu items keyed by plugin_id */
  pluginMenuItems: Record<string, MenuItem[]>;
  /** Export formats from all plugins */
  exportFormats: ExportFormat[];
  loading: boolean;

  loadPlugins: () => Promise<void>;
  loadPlugin: (path: string) => Promise<void>;
  unloadPlugin: (pluginId: string) => Promise<void>;
  setEnabled: (pluginId: string, enabled: boolean) => Promise<void>;
  refreshPluginComponents: (pluginId: string) => Promise<void>;
  refreshMenuItems: (pluginId: string) => Promise<void>;
  refreshExportFormats: () => Promise<void>;
}

export const usePluginStore = create<PluginState>((set, get) => ({
  plugins: [],
  pluginComponents: {},
  pluginMenuItems: {},
  exportFormats: [],
  loading: false,

  loadPlugins: async () => {
    set({ loading: true });
    try {
      const list = await pluginList();
      set({ plugins: list });

      // Refetch components for enabled plugins
      const comps: Record<string, ComponentRegistration[]> = {};
      const menus: Record<string, MenuItem[]> = {};
      for (const p of list) {
        if (p.enabled) {
          try {
            comps[p.id] = await pluginGetComponents(p.id);
          } catch { comps[p.id] = []; }
          try {
            menus[p.id] = await pluginGetMenuItems(p.id);
          } catch { menus[p.id] = []; }
        }
      }
      set({ pluginComponents: comps, pluginMenuItems: menus });
    } catch (e) {
      console.error('Failed to list plugins:', e);
    } finally {
      set({ loading: false });
    }
  },

  loadPlugin: async (path: string) => {
    const info = await pluginLoad(path);
    set((state) => ({ plugins: [...state.plugins.filter((p) => p.id !== info.id), info] }));
    await get().refreshPluginComponents(info.id);
    await get().refreshMenuItems(info.id);
    await get().refreshExportFormats();
  },

  unloadPlugin: async (pluginId: string) => {
    await pluginUnload(pluginId);
    set((state) => {
      const newComps = { ...state.pluginComponents };
      delete newComps[pluginId];
      const newMenus = { ...state.pluginMenuItems };
      delete newMenus[pluginId];
      return {
        plugins: state.plugins.filter((p) => p.id !== pluginId),
        pluginComponents: newComps,
        pluginMenuItems: newMenus,
      };
    });
  },

  setEnabled: async (pluginId: string, enabled: boolean) => {
    await pluginSetEnabled(pluginId, enabled);
    set((state) => ({
      plugins: state.plugins.map((p) => (p.id === pluginId ? { ...p, enabled } : p)),
    }));
    if (enabled) {
      await get().refreshPluginComponents(pluginId);
      await get().refreshMenuItems(pluginId);
    } else {
      set((state) => {
        const newComps = { ...state.pluginComponents };
        delete newComps[pluginId];
        const newMenus = { ...state.pluginMenuItems };
        delete newMenus[pluginId];
        return { pluginComponents: newComps, pluginMenuItems: newMenus };
      });
    }
  },

  refreshPluginComponents: async (pluginId: string) => {
    try {
      const comps = await pluginGetComponents(pluginId);
      set((state) => ({
        pluginComponents: { ...state.pluginComponents, [pluginId]: comps },
      }));
    } catch { /* plugin may be disabled/unloaded */ }
  },

  refreshMenuItems: async (pluginId: string) => {
    try {
      const items = await pluginGetMenuItems(pluginId);
      set((state) => ({
        pluginMenuItems: { ...state.pluginMenuItems, [pluginId]: items },
      }));
    } catch { /* ignore */ }
  },

  refreshExportFormats: async () => {
    try {
      const formats = await pluginGetExportFormats();
      set({ exportFormats: formats });
    } catch { /* ignore */ }
  },
}));
