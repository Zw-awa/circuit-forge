import { invoke } from '@tauri-apps/api/core';
import type { SkinManifest } from '../types/skin';

export interface LoadSkinPackResult {
  manifest: SkinManifest;
  assets: Record<string, string>;
}

export async function loadSkinPack(path: string): Promise<LoadSkinPackResult> {
  return invoke<LoadSkinPackResult>('load_skin_pack', { path });
}

export async function getActiveSkin(): Promise<SkinManifest | null> {
  return invoke<SkinManifest | null>('get_active_skin');
}

export async function setActiveSkin(manifestJson: string): Promise<void> {
  return invoke('set_active_skin', { manifestJson });
}

export async function getSkinAsset(name: string): Promise<string> {
  return invoke<string>('get_skin_asset', { name });
}

export async function clearSkin(): Promise<void> {
  return invoke('clear_skin');
}

export async function exportSkinPack(path: string, manifest: SkinManifest): Promise<void> {
  return invoke('export_skin_pack', {
    path,
    manifestJson: JSON.stringify(manifest),
  });
}
