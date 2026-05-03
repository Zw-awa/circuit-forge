import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { WireEndpoint } from '../types/circuit';
import type { RulePack } from '../types/rules';

// ---- Type definitions ----

export interface AddComponentResult {
  componentId: number;
  inputPins: Array<{ id: number; offsetX: number; offsetY: number }>;
  outputPins: Array<{ id: number; offsetX: number; offsetY: number }>;
}

export interface AddWireResult {
  wireId: number;
  netId: number;
}

export interface AddJunctionResult {
  junctionId: number;
}

export interface SignalHistoryEntry {
  tick: number;
  signal: string;
}

export interface PinData {
  id: number;
  owner: number;
  isOutput: boolean;
  offsetX: number;
  offsetY: number;
}

export interface ComponentData {
  id: number;
  kind: string;
  x: number;
  y: number;
  inputPins: number[];
  outputPins: number[];
}

export interface WireData {
  id: number;
  start: { Pin: number } | { Junction: number };
  end: { Pin: number } | { Junction: number };
  netId: number;
  color?: number | null;
}

export interface LoadProjectResult {
  components: ComponentData[];
  wires: WireData[];
  pins: PinData[];
}

export interface SimTickPayload {
  tick: number;
  changed: Record<string, string>;
}

// ---- Circuit editing commands ----

export async function addComponent(kind: string, x: number, y: number): Promise<AddComponentResult> {
  return invoke<AddComponentResult>("add_component", { kind, x, y });
}

export async function removeComponent(componentId: number): Promise<void> {
  return invoke("remove_component", { componentId });
}

export async function moveComponent(componentId: number, x: number, y: number): Promise<void> {
  return invoke("move_component", { componentId, x, y });
}

export async function addWire(start: WireEndpoint, end: WireEndpoint): Promise<AddWireResult> {
  const toRpc = (ep: WireEndpoint) => ep.type === 'pin' ? { Pin: ep.id } : { Junction: ep.id };
  return invoke<AddWireResult>("add_wire", { start: toRpc(start), end: toRpc(end) });
}

export async function removeWire(wireId: number): Promise<void> {
  return invoke("remove_wire", { wireId });
}

// ---- Junction commands ----

export async function addJunction(x: number, y: number, netId: number): Promise<AddJunctionResult> {
  return invoke<AddJunctionResult>("add_junction", { x, y, netId });
}

export async function removeJunction(junctionId: number): Promise<void> {
  return invoke("remove_junction", { junctionId });
}

// ---- Wire commands ----

export async function setWireColor(wireId: number, color: number): Promise<void> {
  return invoke("set_wire_color", { wireId, color });
}

// ---- Component interaction commands ----

export async function pressButton(componentId: number): Promise<Record<string, string>> {
  return invoke<Record<string, string>>("press_button", { componentId });
}

export async function releaseButton(componentId: number): Promise<Record<string, string>> {
  return invoke<Record<string, string>>("release_button", { componentId });
}

export async function setConstantValue(componentId: number, value: string): Promise<Record<string, string>> {
  return invoke<Record<string, string>>("set_constant_value", { componentId, value });
}

export async function setComponentParam(componentId: number, param: string, value: number): Promise<void> {
  return invoke("set_component_param", { componentId, param, value });
}

// ---- Simulation control commands ----

export async function toggleSwitch(componentId: number): Promise<Record<string, string>> {
  return invoke<Record<string, string>>("toggle_switch", { componentId });
}

export async function simStep(): Promise<Record<string, string>> {
  return invoke<Record<string, string>>("sim_step");
}

export async function simStart(): Promise<void> {
  return invoke("sim_start");
}

export async function simPause(): Promise<void> {
  return invoke("sim_pause");
}

export async function simReset(): Promise<void> {
  return invoke("sim_reset");
}

export async function getSignals(): Promise<Record<string, string>> {
  return invoke<Record<string, string>>("get_signals");
}

export async function setSimMode(mode: string): Promise<void> {
  return invoke("set_sim_mode", { mode });
}

export async function setTickRate(rate: number): Promise<void> {
  return invoke("set_tick_rate", { rate });
}

export async function setSimSpeed(multiplier: number): Promise<void> {
  return invoke("set_sim_speed", { multiplier });
}

export async function simStepN(n: number): Promise<Record<string, string>> {
  return invoke<Record<string, string>>("sim_step_n", { n });
}

export async function getSignalHistory(netId: number): Promise<SignalHistoryEntry[]> {
  return invoke<SignalHistoryEntry[]>("get_signal_history", { netId });
}

// ---- Project commands ----

export async function saveProject(): Promise<string> {
  return invoke<string>("save_project");
}

export async function loadProject(json: string): Promise<LoadProjectResult> {
  return invoke<LoadProjectResult>("load_project", { json });
}

// ---- Event listeners ----

export function listenSimTick(callback: (payload: SimTickPayload) => void): Promise<() => void> {
  return listen<SimTickPayload>("sim-tick", (event) => callback(event.payload));
}

// ---- Rule pack commands ----

export async function getRulePacks(): Promise<RulePack[]> {
  return invoke<RulePack[]>('get_rule_packs');
}

export async function setActiveRulePack(id: number): Promise<void> {
  return invoke('set_active_rule_pack', { id });
}

export async function createCustomRulePack(pack: Partial<RulePack>): Promise<number> {
  return invoke<number>('create_custom_rule_pack', { packJson: pack });
}

export async function updateCustomRulePack(id: number, pack: Partial<RulePack>): Promise<void> {
  return invoke('update_custom_rule_pack', { id, packJson: pack });
}

export async function deleteCustomRulePack(id: number): Promise<void> {
  return invoke('delete_custom_rule_pack', { id });
}
