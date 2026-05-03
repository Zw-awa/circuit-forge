import type { Command } from './Command';
import { removeWire, addWire } from '../ipc/simulationIpc';
import { editorStore } from '../stores/editorStore';
import type { Wire } from '../types/circuit';

export class DeleteWireCmd implements Command {
  description = 'Delete wire';

  private wireId: number;
  private savedWire: Wire | null = null;

  constructor(wireId: number) {
    this.wireId = wireId;
  }

  async execute(): Promise<void> {
    const state = editorStore.getState();
    const wire = state.wires.get(this.wireId);
    if (!wire) return;
    this.savedWire = { ...wire, start: { ...wire.start }, end: { ...wire.end } };
    await removeWire(this.wireId);
    state.removeWire(this.wireId);
  }

  async undo(): Promise<void> {
    if (!this.savedWire) return;
    const result = await addWire(this.savedWire.start, this.savedWire.end);
    editorStore.getState().addWire({
      id: result.wireId,
      start: { type: this.savedWire.start.type, id: this.savedWire.start.id },
      end: { type: this.savedWire.end.type, id: this.savedWire.end.id },
      netId: result.netId,
    });
  }
}
