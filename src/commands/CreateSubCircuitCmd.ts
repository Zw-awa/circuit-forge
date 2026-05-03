import type { Command } from './Command';
import { createSubCircuitDef, deleteSubCircuitDef } from '../ipc/customComponentIpc';
import { editorStore } from '../stores/editorStore';
import type { ExternalPin } from '../types/subcircuit';
import type { CircuitComponent, Pin } from '../types/circuit';

export class CreateSubCircuitCmd implements Command {
  description = 'Create subcircuit';

  private name: string;
  private description_: string;
  private componentIds: number[];
  private externalPins: Partial<ExternalPin>[];
  private defId: number | null = null;
  private savedComponents: CircuitComponent[] = [];
  private savedPins: Pin[] = [];
  private savedWires: Array<{ start: { type: string; id: number }; end: { type: string; id: number } }> = [];

  constructor(
    name: string,
    description_: string,
    componentIds: number[],
    externalPins: Partial<ExternalPin>[],
  ) {
    this.name = name;
    this.description_ = description_;
    this.componentIds = componentIds;
    this.externalPins = externalPins;
  }

  async execute(): Promise<void> {
    const state = editorStore.getState();
    this.savedComponents = [];
    this.savedPins = [];
    this.savedWires = [];
    const compIds = new Set<number>(this.componentIds);
    const compPinIds = new Set<number>();

    for (const cid of this.componentIds) {
      const comp = state.components.get(cid);
      if (!comp) continue;
      this.savedComponents.push({ ...comp });
      for (const pid of [...comp.inputPins, ...comp.outputPins]) {
        compPinIds.add(pid);
      }
    }

    for (const pin of state.pins.values()) {
      if (compIds.has(pin.ownerId)) {
        this.savedPins.push({ ...pin });
      }
    }

    for (const wire of state.wires.values()) {
      const startInside = wire.start.type === 'pin' && compPinIds.has(wire.start.id);
      const endInside = wire.end.type === 'pin' && compPinIds.has(wire.end.id);
      if (startInside || endInside) {
        this.savedWires.push({
          start: { ...wire.start },
          end: { ...wire.end },
        });
      }
    }

    const result = await createSubCircuitDef(this.name, this.description_, this.componentIds, this.externalPins);
    this.defId = result.defId;

    for (const cid of this.componentIds) {
      editorStore.getState().removeComponent(cid);
    }

    editorStore.getState().setActiveSubCircuitDefId(this.defId);
    editorStore.getState().setPlacingComponentKind('SubCircuit');
  }

  async undo(): Promise<void> {
    if (this.defId === null) return;
    await deleteSubCircuitDef(this.defId);

    for (const comp of this.savedComponents) {
      editorStore.getState().addComponent(comp);
    }
    for (const pin of this.savedPins) {
      editorStore.getState().addPins([pin]);
    }

    editorStore.getState().setActiveSubCircuitDefId(null);
    editorStore.getState().setPlacingComponentKind(null);
  }
}
