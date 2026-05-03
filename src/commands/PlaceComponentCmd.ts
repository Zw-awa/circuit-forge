import type { Command } from './Command';
import { addComponent, removeComponent } from '../ipc/simulationIpc';
import { editorStore } from '../stores/editorStore';
import type { ComponentKind } from '../types/circuit';
import type { Pin } from '../types/circuit';

export class PlaceComponentCmd implements Command {
  description = 'Place component';

  private kind: ComponentKind;
  private x: number;
  private y: number;
  private resultId: number | null = null;
  private componentPins: Pin[] = [];
  private inputPinIds: number[] = [];
  private outputPinIds: number[] = [];

  constructor(kind: ComponentKind, x: number, y: number) {
    this.kind = kind;
    this.x = x;
    this.y = y;
  }

  async execute(): Promise<void> {
    const result = await addComponent(this.kind, this.x, this.y);

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
      kind: this.kind,
      x: this.x,
      y: this.y,
      inputPins: this.inputPinIds,
      outputPins: this.outputPinIds,
    });
  }

  async undo(): Promise<void> {
    if (this.resultId === null) return;
    await removeComponent(this.resultId);
    editorStore.getState().removeComponent(this.resultId);
  }
}
