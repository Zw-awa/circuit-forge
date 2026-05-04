import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { BreakpointTarget, BreakpointCondition, Breakpoint, BreakpointHitInfo, StepResult } from '../types/debug';

export async function addBreakpoint(
  target: BreakpointTarget,
  condition: BreakpointCondition,
): Promise<{ id: number }> {
  return invoke<{ id: number }>('add_breakpoint', { target, condition });
}

export async function removeBreakpoint(id: number): Promise<void> {
  return invoke('remove_breakpoint', { id });
}

export async function listBreakpoints(): Promise<Breakpoint[]> {
  return invoke<Breakpoint[]>('list_breakpoints');
}

export async function setBreakpointEnabled(id: number, enabled: boolean): Promise<void> {
  return invoke('set_breakpoint_enabled', { id, enabled });
}

export async function debugStepInto(): Promise<StepResult> {
  return invoke<StepResult>('debug_step_into');
}

export async function debugStepOver(): Promise<StepResult> {
  return invoke<StepResult>('debug_step_over');
}

export async function debugContinue(): Promise<void> {
  return invoke('debug_continue');
}

export function listenBreakpointHit(
  callback: (payload: BreakpointHitInfo) => void,
): Promise<() => void> {
  return listen<BreakpointHitInfo>('breakpoint-hit', (event) => callback(event.payload));
}

export type SignalJson = string | { Bus: number } | { Integer: number } | { Float: number };

/** Normalize a signal value into a SignalJson.
 *  If already a SignalJson object, returns it as-is.
 *  If a plain string like "High"/"Low", returns it as-is.
 *  If a JSON-encoded string (legacy), parses it. */
export function parseSignalJson(raw: SignalJson | string): SignalJson {
  if (typeof raw !== 'string') return raw;
  if (raw === 'High' || raw === 'Low') return raw;
  try {
    const obj = JSON.parse(raw);
    if (typeof obj === 'object' && obj !== null) {
      if ('Bus' in obj) return { Bus: Number(obj.Bus) };
      if ('Integer' in obj) return { Integer: Number(obj.Integer) };
      if ('Float' in obj) return { Float: Number(obj.Float) };
    }
  } catch { /* not JSON, return raw string */ }
  return raw;
}

/** Convert a SignalJson value to a normalized number between 0 and 1 for waveform rendering. */
export function signalToNormalized(signal: SignalJson): number {
  if (signal === 'High') return 1;
  if (signal === 'Low') return 0;
  if (typeof signal === 'object' && signal !== null) {
    if ('Bus' in signal) {
      return Math.max(0, Math.min(1, signal.Bus / 255));
    }
    if ('Integer' in signal) {
      const clamped = Math.max(-128, Math.min(127, signal.Integer));
      return (clamped + 128) / 255;
    }
    if ('Float' in signal) {
      return Math.max(0, Math.min(1, signal.Float));
    }
  }
  return 0;
}

export async function getBulkSignalHistory(
  netIds: number[],
  fromTick?: number,
  toTick?: number,
): Promise<Record<string, Array<[number, SignalJson]>>> {
  return invoke('get_bulk_signal_history', { netIds, fromTick, toTick });
}

export async function exportWaveformCsv(netIds: number[]): Promise<string> {
  return invoke<string>('export_waveform_csv', { netIds });
}
