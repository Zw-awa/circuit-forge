import { invoke } from '@tauri-apps/api/core';
import type { KeyBindingEntry } from '../stores/keybindingStore';

export async function getKeybindings(): Promise<KeyBindingEntry[]> {
  return invoke<KeyBindingEntry[]>('get_keybindings');
}

export async function setKeybinding(action: string, key: string): Promise<void> {
  return invoke('set_keybinding', { action, key });
}

export async function resetKeybindings(): Promise<KeyBindingEntry[]> {
  return invoke<KeyBindingEntry[]>('reset_keybindings');
}

export async function exportKeybindings(): Promise<string> {
  return invoke<string>('export_keybindings');
}

export async function importKeybindings(json: string): Promise<KeyBindingEntry[]> {
  return invoke<KeyBindingEntry[]>('import_keybindings', { json });
}
