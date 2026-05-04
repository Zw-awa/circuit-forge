import { invoke } from '@tauri-apps/api/core';
import type { SubCircuitDef, ExternalPin, EnterSubCircuitData } from '../types/subcircuit';
import type { AddComponentResult } from './simulationIpc';

// ─── SubCircuit ───────────────────────────────────────────────────────────────

export async function createSubCircuitDef(
  name: string,
  description: string,
  componentIds: number[],
  externalPins: Partial<ExternalPin>[]
): Promise<{ defId: number }> {
  return invoke('create_subcircuit_def', { name, description, componentIds, externalPins });
}

export async function updateSubCircuitDef(
  defId: number,
  changes: Partial<SubCircuitDef>
): Promise<void> {
  return invoke('update_subcircuit_def', { defId, changes });
}

export async function deleteSubCircuitDef(defId: number): Promise<void> {
  return invoke('delete_subcircuit_def', { defId });
}

export async function getSubCircuitDefs(): Promise<SubCircuitDef[]> {
  return invoke<SubCircuitDef[]>('get_subcircuit_defs');
}

export async function addSubCircuitInstance(
  defId: number,
  x: number,
  y: number
): Promise<AddComponentResult> {
  return invoke('add_subcircuit_instance', { defId, x, y });
}

export async function enterSubCircuit(componentId: number): Promise<EnterSubCircuitData> {
  return invoke('enter_subcircuit', { componentId });
}

export async function exitSubCircuit(): Promise<void> {
  return invoke('exit_subcircuit');
}

// ─── Lua Script ───────────────────────────────────────────────────────────────

export interface LuaPinDef {
  name: string;
  is_output: boolean;
  offset_x: number;
  offset_y: number;
}

export interface LuaComponentDef {
  id: number;
  name: string;
  description: string;
  script_source: string;
  input_pins: LuaPinDef[];
  output_pins: LuaPinDef[];
  icon_label: string;
  width: number;
  height: number;
}

export async function getLuaComponentDefs(): Promise<LuaComponentDef[]> {
  return invoke<LuaComponentDef[]>('get_lua_component_defs');
}

export async function createLuaComponentDef(
  name: string,
  script: string,
  inputPins: LuaPinDef[],
  outputPins: LuaPinDef[]
): Promise<{ defId: number }> {
  return invoke('create_lua_component_def', { name, script, inputPins, outputPins });
}

export async function updateLuaComponentDef(
  defId: number,
  changes: Partial<LuaComponentDef>
): Promise<void> {
  return invoke('update_lua_component_def', { defId, changes });
}

export async function deleteLuaComponentDef(defId: number): Promise<void> {
  return invoke('delete_lua_component_def', { defId });
}

export async function addLuaComponentInstance(
  defId: number,
  x: number,
  y: number
): Promise<AddComponentResult> {
  return invoke('add_lua_component_instance', { defId, x, y });
}

export async function validateLuaScript(
  source: string,
  inputCount: number,
  outputCount: number
): Promise<{ valid: boolean; errors: string[] }> {
  return invoke('validate_lua_script', { source, inputCount, outputCount });
}

// ─── Truth Table ──────────────────────────────────────────────────────────────

export interface TruthTableRow {
  inputs: string[];
  expected_outputs: string[];
}

export interface TruthTable {
  id: number;
  target_def_id: number;
  target_type: string;
  input_names: string[];
  output_names: string[];
  rows: TruthTableRow[];
}

export interface VerificationFailure {
  row_index: number;
  inputs: string[];
  expected: string[];
  actual: string[];
}

export interface VerificationResult {
  passed: boolean;
  total_rows: number;
  passed_rows: number;
  failures: VerificationFailure[];
}

export async function createTruthTable(
  targetDefId: number,
  targetType: string,
  rows: TruthTableRow[]
): Promise<{ id: number }> {
  return invoke('create_truth_table', { targetDefId, targetType, rows });
}

export async function updateTruthTable(
  id: number,
  rows: TruthTableRow[]
): Promise<void> {
  return invoke('update_truth_table', { id, rows });
}

export async function deleteTruthTable(id: number): Promise<void> {
  return invoke('delete_truth_table', { id });
}

export async function getTruthTable(
  targetDefId: number,
  targetType: string
): Promise<TruthTable | null> {
  return invoke('get_truth_table', { targetDefId, targetType });
}

export async function verifyTruthTable(
  targetDefId: number,
  targetType: string
): Promise<VerificationResult> {
  return invoke('verify_truth_table_cmd', { targetDefId, targetType });
}

export async function exportCustomComponent(
  defId: number,
  componentType: string
): Promise<string> {
  return invoke<string>('export_custom_component', { defId, componentType });
}

export async function importCustomComponent(
  json: string
): Promise<{ id: number; component_type: string; name: string }> {
  return invoke('import_custom_component', { json });
}
