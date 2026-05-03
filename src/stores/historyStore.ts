import { create } from 'zustand';
import type { Command } from '../commands/Command';

interface HistoryState {
  undoStack: Command[];
  redoStack: Command[];
  canUndo: boolean;
  canRedo: boolean;
  execute: (cmd: Command) => Promise<void>;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  clear: () => void;
}

const historyStore = create<HistoryState>()((set, get) => ({
  undoStack: [],
  redoStack: [],
  canUndo: false,
  canRedo: false,

  execute: async (cmd) => {
    await cmd.execute();
    set((state) => ({
      undoStack: [...state.undoStack, cmd],
      redoStack: [],
      canUndo: true,
      canRedo: false,
    }));
  },

  undo: async () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return;
    const cmd = undoStack[undoStack.length - 1];
    await cmd.undo();
    set((state) => ({
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, cmd],
      canUndo: state.undoStack.length > 1,
      canRedo: true,
    }));
  },

  redo: async () => {
    const { redoStack } = get();
    if (redoStack.length === 0) return;
    const cmd = redoStack[redoStack.length - 1];
    await cmd.execute();
    set((state) => ({
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, cmd],
      canUndo: true,
      canRedo: state.redoStack.length > 1,
    }));
  },

  clear: () =>
    set({
      undoStack: [],
      redoStack: [],
      canUndo: false,
      canRedo: false,
    }),
}));

export const useHistoryStore = historyStore;
export { historyStore };
