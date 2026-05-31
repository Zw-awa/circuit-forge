import type { Command } from './Command';
import { addWire, addJunction, removeWire, removeJunction } from '../ipc/simulationIpc';
import { editorStore } from '../stores/editorStore';
import type { WireEndpoint } from '../types/circuit';

export class AddWaypointWireCmd implements Command {
  description = 'Add wire with waypoints';

  private start: WireEndpoint;
  private end: WireEndpoint;
  private waypoints: Array<{ x: number; y: number }>;
  private color: number | undefined;
  private junctionIds: number[] = [];
  private wireIds: number[] = [];

  constructor(
    start: WireEndpoint,
    end: WireEndpoint,
    waypoints: Array<{ x: number; y: number }>,
    color?: number,
  ) {
    this.start = start;
    this.end = end;
    this.waypoints = waypoints;
    this.color = color;
  }

  async execute(): Promise<void> {
    const store = editorStore.getState();
    this.junctionIds = [];
    this.wireIds = [];

    for (const wp of this.waypoints) {
      const result = await addJunction(wp.x, wp.y, 0);
      this.junctionIds.push(result.junctionId);
      store.addJunction({
        id: result.junctionId,
        x: wp.x,
        y: wp.y,
        netId: 0,
      });
    }

    const chain: WireEndpoint[] = [this.start];
    for (const jid of this.junctionIds) {
      chain.push({ type: 'junction', id: jid });
    }
    chain.push(this.end);

    for (let i = 0; i < chain.length - 1; i++) {
      const segStart = chain[i];
      const segEnd = chain[i + 1];
      const result = await addWire(segStart, segEnd, this.color);
      this.wireIds.push(result.wireId);
      store.addWire({
        id: result.wireId,
        start: segStart,
        end: segEnd,
        netId: result.netId,
        color: this.color,
      });
    }
  }

  async undo(): Promise<void> {
    const store = editorStore.getState();

    for (const wid of [...this.wireIds].reverse()) {
      await removeWire(wid);
      store.removeWire(wid);
    }

    for (const jid of this.junctionIds) {
      await removeJunction(jid);
      store.removeJunction(jid);
    }
  }
}
