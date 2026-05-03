import type { Command } from './Command';
import { removeJunction, removeWire, addJunction, addWire } from '../ipc/simulationIpc';
import { editorStore } from '../stores/editorStore';
import type { WireEndpoint } from '../types/circuit';

interface SavedWire {
  otherEndpoint: WireEndpoint;
}

export class DeleteJunctionCmd implements Command {
  description: string;
  private junctionId: number;
  private savedX = 0;
  private savedY = 0;
  private savedNetId = 0;
  private savedWires: SavedWire[] = [];

  constructor(junctionId: number) {
    this.junctionId = junctionId;
    this.description = `Delete junction ${junctionId}`;
  }

  async execute(): Promise<void> {
    const state = editorStore.getState();
    const j = state.junctions.get(this.junctionId);
    if (!j) return;
    this.savedX = j.x;
    this.savedY = j.y;
    this.savedNetId = j.netId;
    this.savedWires = [];

    for (const [, wire] of state.wires) {
      if (wire.start.type === 'junction' && wire.start.id === this.junctionId) {
        this.savedWires.push({ otherEndpoint: wire.end });
        await removeWire(wire.id);
        state.removeWire(wire.id);
      }
      if (wire.end.type === 'junction' && wire.end.id === this.junctionId) {
        this.savedWires.push({ otherEndpoint: wire.start });
        await removeWire(wire.id);
        state.removeWire(wire.id);
      }
    }

    await removeJunction(this.junctionId);
    state.removeJunction(this.junctionId);
  }

  async undo(): Promise<void> {
    const result = await addJunction(this.savedX, this.savedY, this.savedNetId);
    const newJunctionId = result.junctionId;
    editorStore.getState().addJunction({
      id: newJunctionId,
      x: this.savedX,
      y: this.savedY,
      netId: this.savedNetId,
    });

    const junctionEp: WireEndpoint = { type: 'junction', id: newJunctionId };
    for (const sw of this.savedWires) {
      const wireResult = await addWire(junctionEp, sw.otherEndpoint);
      editorStore.getState().addWire({
        id: wireResult.wireId,
        start: junctionEp,
        end: sw.otherEndpoint,
        netId: wireResult.netId,
      });
    }
  }
}
