import type { Command } from './Command';
import { removeComponent, addComponent, addWire } from '../ipc/simulationIpc';
import { editorStore } from '../stores/editorStore';
import type { CircuitComponent, Pin, Wire } from '../types/circuit';
import type { AddComponentResult } from '../ipc/simulationIpc';

interface SavedState {
  component: CircuitComponent;
  pins: Pin[];
  wires: Wire[];
}

export class DeleteComponentCmd implements Command {
  description = 'Delete component';

  private componentId: number;
  private savedState: SavedState | null = null;

  constructor(componentId: number) {
    this.componentId = componentId;
  }

  async execute(): Promise<void> {
    const state = editorStore.getState();
    const comp = state.components.get(this.componentId);
    if (!comp) return;

    const savedPins: Pin[] = [];
    for (const pin of state.pins.values()) {
      if (pin.ownerId === this.componentId) {
        savedPins.push({ ...pin });
      }
    }

    const savedWires: Wire[] = [];
    const pinIds = new Set(savedPins.map((p) => p.id));
    for (const wire of state.wires.values()) {
      const startIsPin = wire.start.type === 'pin' && pinIds.has(wire.start.id);
      const endIsPin = wire.end.type === 'pin' && pinIds.has(wire.end.id);
      if (startIsPin || endIsPin) {
        savedWires.push({ ...wire, start: { ...wire.start }, end: { ...wire.end } });
      }
    }

    this.savedState = {
      component: { ...comp },
      pins: savedPins,
      wires: savedWires,
    };

    await removeComponent(this.componentId);
    editorStore.getState().removeComponent(this.componentId);
  }

  async undo(): Promise<void> {
    if (!this.savedState) return;

    const { component, pins } = this.savedState;

    const result: AddComponentResult = await addComponent(
      component.kind,
      component.x,
      component.y,
    );

    const oldToNewId = new Map<number, number>();
    const oldPinIds = pins.sort((a, b) => {
      if (a.isOutput !== b.isOutput) return a.isOutput ? 1 : -1;
      return a.offsetY - b.offsetY;
    });
    const newInputPins = result.inputPins.sort((a, b) => a.offsetY - b.offsetY);
    const newOutputPins = result.outputPins.sort((a, b) => a.offsetY - b.offsetY);

    let inputIdx = 0;
    let outputIdx = 0;
    for (const oldPin of oldPinIds) {
      if (oldPin.isOutput) {
        if (outputIdx < newOutputPins.length) {
          oldToNewId.set(oldPin.id, newOutputPins[outputIdx].id);
          outputIdx++;
        }
      } else {
        if (inputIdx < newInputPins.length) {
          oldToNewId.set(oldPin.id, newInputPins[inputIdx].id);
          inputIdx++;
        }
      }
    }

    const newPins: Pin[] = [
      ...result.inputPins.map((p) => ({
        id: p.id,
        ownerId: result.componentId,
        isOutput: false,
        offsetX: p.offsetX,
        offsetY: p.offsetY,
        worldX: component.x + p.offsetX,
        worldY: component.y + p.offsetY,
      })),
      ...result.outputPins.map((p) => ({
        id: p.id,
        ownerId: result.componentId,
        isOutput: true,
        offsetX: p.offsetX,
        offsetY: p.offsetY,
        worldX: component.x + p.offsetX,
        worldY: component.y + p.offsetY,
      })),
    ];

    const store = editorStore.getState();
    store.addComponent({
      id: result.componentId,
      kind: component.kind,
      x: component.x,
      y: component.y,
      inputPins: result.inputPins.map((p) => p.id),
      outputPins: result.outputPins.map((p) => p.id),
    });
    store.addPins(newPins);

    for (const savedWire of this.savedState.wires) {
      const newStart = savedWire.start.type === 'pin'
        ? { type: 'pin' as const, id: oldToNewId.get(savedWire.start.id) ?? savedWire.start.id }
        : savedWire.start;
      const newEnd = savedWire.end.type === 'pin'
        ? { type: 'pin' as const, id: oldToNewId.get(savedWire.end.id) ?? savedWire.end.id }
        : savedWire.end;
      const wireResult = await addWire(newStart, newEnd);
      editorStore.getState().addWire({
        id: wireResult.wireId,
        start: newStart,
        end: newEnd,
        netId: wireResult.netId,
      });
    }
  }
}
