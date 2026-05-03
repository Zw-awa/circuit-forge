import type { Command } from './Command';
import { moveComponent } from '../ipc/simulationIpc';
import { editorStore } from '../stores/editorStore';

interface MovedEntry {
  id: number;
  oldX: number;
  oldY: number;
  newX: number;
  newY: number;
}

export class MoveComponentCmd implements Command {
  description = 'Move components';

  private entries: MovedEntry[];

  constructor(entries: MovedEntry[]) {
    this.entries = entries;
  }

  async execute(): Promise<void> {
    const store = editorStore.getState();
    for (const entry of this.entries) {
      await moveComponent(entry.id, entry.newX, entry.newY);
      store.moveComponent(entry.id, entry.newX, entry.newY);
    }
  }

  async undo(): Promise<void> {
    const store = editorStore.getState();
    for (const entry of this.entries) {
      await moveComponent(entry.id, entry.oldX, entry.oldY);
      store.moveComponent(entry.id, entry.oldX, entry.oldY);
    }
  }
}
