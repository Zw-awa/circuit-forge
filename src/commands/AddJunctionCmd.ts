import type { Command } from './Command';
import { addJunction, removeJunction } from '../ipc/simulationIpc';
import { editorStore } from '../stores/editorStore';

export class AddJunctionCmd implements Command {
  description: string;
  private x: number;
  private y: number;
  private netId: number;
  private resultId?: number;

  constructor(x: number, y: number, netId: number) {
    this.x = x;
    this.y = y;
    this.netId = netId;
    this.description = `Add junction at (${x}, ${y})`;
  }

  async execute(): Promise<void> {
    const result = await addJunction(this.x, this.y, this.netId);
    this.resultId = result.junctionId;
    editorStore.getState().addJunction({
      id: result.junctionId,
      x: this.x,
      y: this.y,
      netId: this.netId,
    });
  }

  async undo(): Promise<void> {
    if (this.resultId === undefined) return;
    await removeJunction(this.resultId);
    editorStore.getState().removeJunction(this.resultId);
  }
}
