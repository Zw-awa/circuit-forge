import { invoke } from '@tauri-apps/api/core';
import type { PluginInfo, ComponentRegistration, MenuItem, ExportFormat } from '../types/plugin';

// ─── Plugin Management ─────────────────────────────────────────────────────────

export async function pluginLoad(path: string): Promise<PluginInfo> {
  return invoke<PluginInfo>('plugin_load', { path });
}

export async function pluginUnload(pluginId: string): Promise<void> {
  return invoke('plugin_unload', { pluginId });
}

export async function pluginList(): Promise<PluginInfo[]> {
  return invoke<PluginInfo[]>('plugin_list');
}

export async function pluginSetEnabled(pluginId: string, enabled: boolean): Promise<void> {
  return invoke('plugin_set_enabled', { pluginId, enabled });
}

export async function pluginGetComponents(pluginId: string): Promise<ComponentRegistration[]> {
  return invoke<ComponentRegistration[]>('plugin_get_components', { pluginId });
}

export async function pluginGetMenuItems(pluginId: string): Promise<MenuItem[]> {
  return invoke<MenuItem[]>('plugin_get_menu_items', { pluginId });
}

export async function pluginGetExportFormats(): Promise<ExportFormat[]> {
  return invoke<ExportFormat[]>('plugin_get_export_formats');
}

export async function pluginCallMenuItem(pluginId: string, menuItemId: number): Promise<void> {
  return invoke('plugin_call_menu_item', { pluginId, menuItemId });
}

export async function pluginEvaluate(
  pluginId: string,
  kindName: string,
  inputs: unknown[],
): Promise<unknown[]> {
  return invoke<unknown[]>('plugin_evaluate', { pluginId, kindName, inputs });
}

// ─── Plugin Component Placement ────────────────────────────────────────────────

export interface AddComponentResult {
  componentId: number;
  inputPins: Array<{ id: number; offsetX: number; offsetY: number }>;
  outputPins: Array<{ id: number; offsetX: number; offsetY: number }>;
}

/** Add a component with optional plugin info for Plugin kind. */
export async function addComponent(
  kind: string,
  x: number,
  y: number,
  pluginId?: string,
  pluginKindName?: string,
): Promise<AddComponentResult> {
  return invoke<AddComponentResult>('add_component', {
    kind,
    x,
    y,
    pluginId: pluginId ?? null,
    pluginKindName: pluginKindName ?? null,
  });
}
