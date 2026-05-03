import type { Tool, CanvasPointerEvent } from '../Tool';
import { Picker } from '../Picker';
import { WebGLRenderer } from '../../renderer/WebGLRenderer';
import { editorStore } from '../../stores/editorStore';
import { historyStore } from '../../stores/historyStore';
import { simulationStore } from '../../stores/simulationStore';
import { MoveComponentCmd } from '../../commands/MoveComponentCmd';
import { toggleSwitch, pressButton, releaseButton } from '../../ipc/simulationIpc';

export class SelectTool implements Tool {
  private picker: Picker;
  private renderer: WebGLRenderer;

  private isDragging = false;
  private isBoxSelecting = false;
  private dragStartWorldX = 0;
  private dragStartWorldY = 0;
  private draggedCompIds: number[] = [];
  private startPositions: Map<number, [number, number]> = new Map();
  private boxStartX = 0;
  private boxStartY = 0;
  private lastClickTime = 0;
  private lastClickId: number | null = null;
  private pressedButtonId: number | null = null;

  constructor(picker: Picker, renderer: WebGLRenderer) {
    this.picker = picker;
    this.renderer = renderer;
  }

  onActivate(): void {
    this.renderer.clearGhostComponent();
    this.renderer.clearWirePreview();
  }

  onDeactivate(): void {}

  onPointerDown(e: CanvasPointerEvent): void {
    if (e.button === 2) {
      editorStore.getState().setActiveTool('select');
      return;
    }
    if (e.button !== 0) return;

    const hitId = this.picker.hitTestComponent(e.worldX, e.worldY);

    const now = performance.now();

    if (hitId !== null && hitId === this.lastClickId && now - this.lastClickTime < 300) {
      const comp = editorStore.getState().components.get(hitId);
      if (comp) {
        if (comp.kind === 'Switch') {
          toggleSwitch(hitId).then((changed) => {
            simulationStore.getState().updateSignals(changed);
          });
          this.lastClickTime = 0;
          this.lastClickId = null;
          return;
        }
        if (comp.kind === 'SubCircuit') {
          editorStore.getState().enterSubCircuit(hitId).catch((e) => {
            console.error('Failed to enter subcircuit:', e);
          });
          this.lastClickTime = 0;
          this.lastClickId = null;
          return;
        }
      }
    }
    this.lastClickTime = now;
    this.lastClickId = hitId;

    if (hitId !== null) {
      const comp = editorStore.getState().components.get(hitId);
      if (comp && comp.kind === 'Button') {
        this.pressedButtonId = hitId;
        pressButton(hitId).then((changed) => {
          simulationStore.getState().updateSignals(changed);
        });
        return;
      }
    }

    if (hitId !== null) {
      const state = editorStore.getState();

      if (e.shiftKey) {
        if (state.selectedIds.has(hitId)) {
          state.removeFromSelection(hitId);
        } else {
          state.addToSelection(hitId);
        }
      } else {
        if (!state.selectedIds.has(hitId)) {
          state.setSelection([hitId]);
        }
      }

      this.isDragging = true;
      this.isBoxSelecting = false;
      this.dragStartWorldX = e.gridX;
      this.dragStartWorldY = e.gridY;

      this.startPositions.clear();
      const updatedState = editorStore.getState();
      this.draggedCompIds = Array.from(updatedState.selectedIds);
      for (const id of this.draggedCompIds) {
        const comp = updatedState.components.get(id);
        if (comp) {
          this.startPositions.set(id, [comp.x, comp.y]);
        }
      }
    } else {
      this.isDragging = false;
      this.isBoxSelecting = true;
      this.boxStartX = e.worldX;
      this.boxStartY = e.worldY;
      if (!e.shiftKey) {
        editorStore.getState().clearSelection();
      }
    }
  }

  onPointerMove(e: CanvasPointerEvent): void {
    if (!this.isDragging && !this.isBoxSelecting) {
      const state = editorStore.getState();
      const hitId = this.picker.hitTestComponent(e.worldX, e.worldY);
      state.setHoveredId(hitId);
      return;
    }

    if (this.isDragging) {
      const canvasMode = editorStore.getState().canvasMode;
      const dx = e.gridX - this.dragStartWorldX;
      const dy = e.gridY - this.dragStartWorldY;
      const moveDx = canvasMode === 'free' ? dx : Math.round(dx);
      const moveDy = canvasMode === 'free' ? dy : Math.round(dy);

      const store = editorStore.getState();
      for (const id of this.draggedCompIds) {
        const start = this.startPositions.get(id);
        if (start) {
          store.moveComponent(id, start[0] + moveDx, start[1] + moveDy);
        }
      }
    }

    if (this.isBoxSelecting) {
      this.renderer.setBoxSelectRect(this.boxStartX, this.boxStartY, e.worldX, e.worldY);
    }
  }

  onPointerUp(e: CanvasPointerEvent): void {
    if (this.pressedButtonId !== null) {
      releaseButton(this.pressedButtonId).then((changed) => {
        simulationStore.getState().updateSignals(changed);
      });
      this.pressedButtonId = null;
    }

    if (this.isDragging) {
      this.isDragging = false;

      const canvasMode = editorStore.getState().canvasMode;
      const dx = e.gridX - this.dragStartWorldX;
      const dy = e.gridY - this.dragStartWorldY;
      const moveDx = canvasMode === 'free' ? dx : Math.round(dx);
      const moveDy = canvasMode === 'free' ? dy : Math.round(dy);

      if (moveDx !== 0 || moveDy !== 0) {
        const entries = this.draggedCompIds.map((id) => {
          const start = this.startPositions.get(id);
          return {
            id,
            oldX: start ? start[0] : 0,
            oldY: start ? start[1] : 0,
            newX: (start ? start[0] : 0) + moveDx,
            newY: (start ? start[1] : 0) + moveDy,
          };
        });

        const cmd = new MoveComponentCmd(entries);
        historyStore.getState().execute(cmd);
      }
    }

    if (this.isBoxSelecting) {
      this.isBoxSelecting = false;
      this.renderer.clearBoxSelectRect();
      const minX = Math.min(this.boxStartX, e.worldX);
      const minY = Math.min(this.boxStartY, e.worldY);
      const maxX = Math.max(this.boxStartX, e.worldX);
      const maxY = Math.max(this.boxStartY, e.worldY);
      const hits = this.picker.hitTestRect(minX, minY, maxX, maxY);
      if (hits.length > 0) {
        editorStore.getState().setSelection(hits);
      }
    }
  }
}
