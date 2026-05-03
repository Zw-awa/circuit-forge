import type { Tool, CanvasPointerEvent } from '../Tool';
import { Picker } from '../Picker';
import { editorStore } from '../../stores/editorStore';
import { historyStore } from '../../stores/historyStore';
import { DeleteComponentCmd } from '../../commands/DeleteComponentCmd';
import { DeleteWireCmd } from '../../commands/DeleteWireCmd';
import { CompositeCmd } from '../../commands/CompositeCmd';
import { DeleteJunctionCmd } from '../../commands/DeleteJunctionCmd';

export class DeleteTool implements Tool {
  private picker: Picker;

  constructor(picker: Picker, _renderer?: unknown) {
    this.picker = picker;
  }

  onActivate(): void {}

  onDeactivate(): void {
    editorStore.getState().setHoveredId(null);
  }

  onPointerDown(e: CanvasPointerEvent): void {
    if (e.button !== 0) return;

    const hitCompId = this.picker.hitTestComponent(e.worldX, e.worldY);
    if (hitCompId !== null) {
      this.deleteComponent(hitCompId);
      return;
    }

    const hitJunctionId = this.picker.hitTestJunction(e.worldX, e.worldY);
    if (hitJunctionId !== null) {
      this.deleteJunction(hitJunctionId);
      return;
    }

    const hitWireId = this.picker.hitTestWire(e.worldX, e.worldY);
    if (hitWireId !== null) {
      const cmd = new DeleteWireCmd(hitWireId);
      historyStore.getState().execute(cmd);
    }
  }

  onPointerMove(e: CanvasPointerEvent): void {
    const hitCompId = this.picker.hitTestComponent(e.worldX, e.worldY);
    if (hitCompId !== null) {
      editorStore.getState().setHoveredId(hitCompId);
      return;
    }
    const hitWireId = this.picker.hitTestWire(e.worldX, e.worldY);
    editorStore.getState().setHoveredId(hitWireId);
  }

  onPointerUp(_e: CanvasPointerEvent): void {}

  private deleteComponent(compId: number): void {
    const state = editorStore.getState();
    const comp = state.components.get(compId);
    if (!comp) return;

    const compPins = [...comp.inputPins, ...comp.outputPins];
    const processedWireIds = new Set<number>();
    const cmds: (DeleteWireCmd | DeleteComponentCmd)[] = [];

    for (const wire of state.wires.values()) {
      if ((compPins.includes(wire.start.id) || compPins.includes(wire.end.id)) && !processedWireIds.has(wire.id)) {
        processedWireIds.add(wire.id);
        cmds.push(new DeleteWireCmd(wire.id));
      }
    }
    cmds.push(new DeleteComponentCmd(compId));

    historyStore.getState().execute(new CompositeCmd(cmds));
  }

  private deleteJunction(junctionId: number): void {
    historyStore.getState().execute(new DeleteJunctionCmd(junctionId));
  }
}
