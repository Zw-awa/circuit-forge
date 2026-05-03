import type { Command } from './Command';
import { moveComponent } from '../ipc/simulationIpc';
import { editorStore } from '../stores/editorStore';

export class SnapToGridCmd implements Command {
  description = 'Snap components to grid';
  private moves: Array<{ id: number; oldX: number; oldY: number; newX: number; newY: number }> = [];

  async execute(): Promise<void> {
    const state = editorStore.getState();
    this.moves = [];

    for (const [, comp] of state.components) {
      const newX = Math.round(comp.x);
      const newY = Math.round(comp.y);
      if (newX !== comp.x || newY !== comp.y) {
        this.moves.push({ id: comp.id, oldX: comp.x, oldY: comp.y, newX, newY });
      }
    }

    for (const m of this.moves) {
      await moveComponent(m.id, m.newX, m.newY);
      editorStore.getState().moveComponent(m.id, m.newX, m.newY);
    }
  }

  async undo(): Promise<void> {
    for (const m of this.moves) {
      await moveComponent(m.id, m.oldX, m.oldY);
      editorStore.getState().moveComponent(m.id, m.oldX, m.oldY);
    }
  }
}
