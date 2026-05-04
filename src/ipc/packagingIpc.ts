import { invoke } from '@tauri-apps/api/core';
import type { SnapshotInfo, ImportCircuitForgeSummary, ImportCircuitForgeResult } from '../types/packaging';

export async function exportCircuitForge(name: string, path: string): Promise<string> {
  return invoke<string>('export_circuitforge', { name, path });
}

export async function importCircuitForge(path: string): Promise<ImportCircuitForgeSummary> {
  return invoke<ImportCircuitForgeSummary>('import_circuitforge', { path });
}

export async function createSnapshot(name: string): Promise<SnapshotInfo> {
  return invoke<SnapshotInfo>('create_snapshot_cmd', { name });
}

export async function listSnapshots(): Promise<SnapshotInfo[]> {
  return invoke<SnapshotInfo[]>('list_snapshots');
}

export async function restoreSnapshot(id: number): Promise<ImportCircuitForgeResult> {
  return invoke<ImportCircuitForgeResult>('restore_snapshot', { id });
}
