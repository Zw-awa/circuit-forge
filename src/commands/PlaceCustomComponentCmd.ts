import type { Command } from './Command';
import { removeComponent } from '../ipc/simulationIpc';
import { addSubCircuitInstance, addLuaComponentInstance } from '../ipc/customComponentIpc';
import { editorStore } from '../stores/editorStore';
import type { Pin } from '../types/circuit';

export class PlaceCustomComponentCmd implements Command {
  description = 'Place custom component';

  private defId: number;
  private defType: 'SubCircuit' | 'LuaScript';
  private x: number;
  private y: number;
  private resultId: number | null = null;
  private componentPins: Pin[] = [];
  private inputPinIds: number[] = [];
  private outputPinIds: number[] = [];

  constructor(defId: number, defType: 'SubCircuit' | 'LuaScript', x: number, y: number) {
    this.defId = defId;
    this.defType = defType;
    this.x = x;
    this.y = y;
  }

  async execute(): Promise<void> {
    const result =
      this.defType === 'SubCircuit'
        ? await addSubCircuitInstance(this.defId, this.x, this.y)
        : await addLuaComponentInstance(this.defId, this.x, this.y);

    this.resultId = result.componentId;
    this.inputPinIds = [];
    this.outputPinIds = [];
    this.componentPins = [];

    for (const p of result.inputPins) {
      this.inputPinIds.push(p.id);
      this.componentPins.push({
        id: p.id,
        ownerId: result.componentId,
        isOutput: false,
        offsetX: p.offsetX,
        offsetY: p.offsetY,
        worldX: this.x + p.offsetX,
        worldY: this.y + p.offsetY,
      });
    }

    for (const p of result.outputPins) {
      this.outputPinIds.push(p.id);
      this.componentPins.push({
        id: p.id,
        ownerId: result.componentId,
        isOutput: true,
        offsetX: p.offsetX,
        offsetY: p.offsetY,
        worldX: this.x + p.offsetX,
        worldY: this.y + p.offsetY,
      });
    }

    editorStore.getState().addPins(this.componentPins);
    editorStore.getState().addComponent({
      id: result.componentId,
      kind: this.defType,
      x: this.x,
      y: this.y,
      inputPins: this.inputPinIds,
      outputPins: this.outputPinIds,
      subCircuitDefId: this.defType === 'SubCircuit' ? this.defId : undefined,
      luaScriptDefId: this.defType === 'LuaScript' ? this.defId : undefined,
    });
  }

  async undo(): Promise<void> {
    if (this.resultId === null) return;
    await removeComponent(this.resultId);
    editorStore.getState().removeComponent(this.resultId);
  }
}
