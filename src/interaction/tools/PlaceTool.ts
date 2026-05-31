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

    const state = editorStore.getState();
    const kind = state.placingComponentKind;
    if (!kind) return;

    // Prevent overlap: check if position is already occupied
    const components = state.components;
    for (const comp of components.values()) {
      if (Math.abs(comp.x - e.gridX) < 1.05 && Math.abs(comp.y - e.gridY) < 1.05) {
        return;
      }
    }

    const cmd = new PlaceComponentCmd(
      kind as ComponentKind,
      e.gridX,
      e.gridY,
      state.activeSubCircuitDefId,
      state.activeLuaDefId,
      state.activePluginId,
      state.activePluginKindName,
    );
    historyStore.getState().execute(cmd);
  }

  onPointerMove(e: CanvasPointerEvent): void {
    const state = editorStore.getState();
    const kind = state.placingComponentKind;
    if (!kind) return;

    this.renderer.setGhostComponent(kind as ComponentKind, e.gridX, e.gridY);
  }

  onPointerUp(_e: CanvasPointerEvent): void {}
}
