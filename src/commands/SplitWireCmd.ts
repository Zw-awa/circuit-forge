import type { Command } from './Command';
import { AddJunctionCmd } from './AddJunctionCmd';
import { editorStore } from '../stores/editorStore';

export class SplitWireCmd implements Command {
  description = 'Split wire';
  private addJunction: AddJunctionCmd;

  constructor(wireId: number, junctionX: number, junctionY: number) {
    const wire = editorStore.getState().wires.get(wireId);
    const netId = wire?.netId ?? 0;
    this.addJunction = new AddJunctionCmd(junctionX, junctionY, netId);
  }

  async execute(): Promise<void> {
    await this.addJunction.execute();
  }

  async undo(): Promise<void> {
    await this.addJunction.undo();
  }
}
