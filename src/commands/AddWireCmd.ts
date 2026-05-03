import type { Command } from './Command';
import { addWire, removeWire } from '../ipc/simulationIpc';
import { editorStore } from '../stores/editorStore';
import type { WireEndpoint } from '../types/circuit';

export class AddWireCmd implements Command {
  description = 'Add wire';

  private start: WireEndpoint;
  private end: WireEndpoint;
  private wireId: number | null = null;

  constructor(start: WireEndpoint, end: WireEndpoint) {
    this.start = start;
    this.end = end;
  }

  async execute(): Promise<void> {
    const result = await addWire(this.start, this.end);
    this.wireId = result.wireId;
    editorStore.getState().addWire({
      id: result.wireId,
      start: this.start,
      end: this.end,
      netId: result.netId,
    });
  }

  async undo(): Promise<void> {
    if (this.wireId === null) return;
    await removeWire(this.wireId);
    editorStore.getState().removeWire(this.wireId);
  }
}
