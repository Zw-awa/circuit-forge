import { create } from 'zustand';
import type { SkinManifest } from '../types/skin';

interface SkinState {
  activeSkin: SkinManifest | null;
  skinAssets: Record<string, string>;
  setActiveSkin: (skin: SkinManifest | null) => void;
  setSkinAssets: (assets: Record<string, string>) => void;
  clearSkin: () => void;
}

export const useSkinStore = create<SkinState>((set) => ({
  activeSkin: null,
  skinAssets: {},
  setActiveSkin: (skin) => set({ activeSkin: skin }),
  setSkinAssets: (assets) => set({ skinAssets: assets }),
  clearSkin: () => set({ activeSkin: null, skinAssets: {} }),
}));
