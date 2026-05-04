import { invoke } from '@tauri-apps/api/core';
import type { SkinManifest } from '../types/skin';

export interface WorkshopItem {
  id: string;
  type: string;
  name: string;
  author: string;
  description: string;
  downloadUrl: string;
  thumbnailUrl: string | null;
  tags: string[];
  version: string;
  updatedAt: string;
  fileSize: number;
  fileType: string;
}

export interface TutorialLink {
  title: string;
  url: string;
  language: string;
  tags: string[];
}

export interface WorkshopIndex {
  version: number;
  indexUrl: string | null;
  items: WorkshopItem[];
  tutorials: TutorialLink[];
}

export interface WorkshopDownloadResult {
  success: boolean;
  defId?: number;
  componentType?: string;
  name?: string;
  skinId?: string;
  componentCount?: number;
  customComponentCount?: number;
  rulePackCount?: number;
  manifest?: SkinManifest;
  assets?: Record<string, string>;
}

export async function workshopFetchIndex(url?: string): Promise<WorkshopIndex> {
  return invoke<WorkshopIndex>('workshop_fetch_index', { url });
}

export async function workshopDownloadItem(
  fileUrl: string,
  fileType: string,
): Promise<WorkshopDownloadResult> {
  return invoke<WorkshopDownloadResult>('workshop_download_item', { fileUrl, fileType });
}

export async function workshopSearch(query: string): Promise<WorkshopItem[]> {
  return invoke<WorkshopItem[]>('workshop_search', { query });
}
