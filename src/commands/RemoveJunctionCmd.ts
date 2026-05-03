import type { Command } from './Command';
import { removeJunction, addJunction } from '../ipc/simulationIpc';
import { editorStore } from '../stores/editorStore';

export class RemoveJunctionCmd implements Command {
  description: string;
  private junctionId: number;
  private savedX = 0;
  private savedY = 0;
  private savedNetId = 0;

  constructor(junctionId: number) {
    this.junctionId = junctionId;
    this.description = `Remove junction ${junctionId}`;
  }

  async execute(): Promise<void> {
    const state = editorStore.getState();
    const j = state.junctions.get(this.junctionId);
    if (j) {
      this.savedX = j.x;
      this.savedY = j.y;
      this.savedNetId = j.netId;
    }
    await removeJunction(this.junctionId);
    state.removeJunction(this.junctionId);
  }

  async undo(): Promise<void> {
    const result = await addJunction(this.savedX, this.savedY, this.savedNetId);
    editorStore.getState().addJunction({
      id: result.junctionId,
      x: this.savedX,
      y: this.savedY,
      netId: this.savedNetId,
    });
  }
}
