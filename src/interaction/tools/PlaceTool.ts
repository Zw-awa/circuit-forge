import type { Tool, CanvasPointerEvent } from '../Tool';
import type { Picker } from '../Picker';
import { WebGLRenderer } from '../../renderer/WebGLRenderer';
import { editorStore } from '../../stores/editorStore';
import { historyStore } from '../../stores/historyStore';
import { PlaceComponentCmd } from '../../commands/PlaceComponentCmd';
import type { ComponentKind } from '../../types/circuit';

export class PlaceTool implements Tool {
  private renderer: WebGLRenderer;

  constructor(_picker: Picker, renderer: WebGLRenderer) {
    this.renderer = renderer;
  }

  onActivate(): void {
    const state = editorStore.getState();
    if (state.placingComponentKind === null) {
      editorStore.setState({ placingComponentKind: 'And' });
    }
  }

  onDeactivate(): void {
    this.renderer.clearGhostComponent();
  }

  onPointerDown(e: CanvasPointerEvent): void {
    if (e.button === 2) {
      editorStore.getState().setActiveTool('select');
      return;
    }
    if (e.button !== 0) return;

    const kind = editorStore.getState().placingComponentKind;
    if (!kind) return;

    const cmd = new PlaceComponentCmd(kind as ComponentKind, e.gridX, e.gridY);
    historyStore.getState().execute(cmd);
  }

  onPointerMove(e: CanvasPointerEvent): void {
    const kind = editorStore.getState().placingComponentKind;
    if (!kind) return;

    this.renderer.setGhostComponent(kind as ComponentKind, e.gridX, e.gridY);
  }

  onPointerUp(_e: CanvasPointerEvent): void {}
}
