import { Camera } from '../renderer/Camera';
import type { ToolManager } from './ToolManager';
import { editorStore } from '../stores/editorStore';
import { historyStore } from '../stores/historyStore';
import { useKeybindingStore } from '../stores/keybindingStore';
import { useThemeStore } from '../stores/themeStore';
import { createSnapshot } from '../ipc/packagingIpc';
import { DeleteComponentCmd } from '../commands/DeleteComponentCmd';
import { DeleteWireCmd } from '../commands/DeleteWireCmd';
import { CompositeCmd } from '../commands/CompositeCmd';

function normalizeKey(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
  if (e.shiftKey) parts.push('Shift');
  if (e.altKey) parts.push('Alt');
  const key = e.key === ' ' ? 'Space' : e.key;
  if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
    parts.push(key.length === 1 ? key.toUpperCase() : key);
  }
  return parts.join('+');
}

export class InputManager {
  private canvas: HTMLCanvasElement;
  private camera: Camera;
  private toolManager: ToolManager;
  private spaceDown = false;
  private panning = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private boundOnMouseDown: (e: MouseEvent) => void;
  private boundOnMouseMove: (e: MouseEvent) => void;
  private boundOnMouseUp: (e: MouseEvent) => void;
  private boundOnWheel: (e: WheelEvent) => void;
  private boundOnContextMenu: (e: Event) => void;
  private boundOnKeyDown: (e: KeyboardEvent) => void;
  private boundOnKeyUp: (e: KeyboardEvent) => void;

  private actionHandlers: Record<string, () => void> = {
    'tool.select': () => editorStore.getState().setActiveTool('select'),
    'tool.place': () => editorStore.getState().setActiveTool('place'),
    'tool.wire': () => editorStore.getState().setActiveTool('wire'),
    'tool.delete': () => editorStore.getState().setActiveTool('delete'),
    'edit.undo': () => historyStore.getState().undo(),
    'edit.redo': () => historyStore.getState().redo(),
    'edit.redo_alt': () => historyStore.getState().redo(),
    'edit.delete': () => this.handleDelete(),
    'edit.delete_alt': () => this.handleDelete(),
    'file.save': () => window.dispatchEvent(new CustomEvent('circuit-save')),
    'file.open': () => window.dispatchEvent(new CustomEvent('circuit-open')),
    'canvas.gridMode': () => editorStore.getState().setCanvasMode('grid'),
    'canvas.freeMode': () => editorStore.getState().setCanvasMode('free'),
    'canvas.escape': () => editorStore.getState().setActiveTool('select'),
    'canvas.pan': () => {},
    'sim.signalDisplay': () => {
      window.dispatchEvent(new CustomEvent('toggle-signal-display'));
    },
    'snapshot.create': async () => {
      try {
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        await createSnapshot(`snapshot-${ts}`);
      } catch (err) {
        console.error('Snapshot create failed:', err);
      }
    },
    'theme.toggle': () => useThemeStore.getState().toggleTheme(),
  };

  constructor(canvas: HTMLCanvasElement, camera: Camera, toolManager: ToolManager) {
    this.canvas = canvas;
    this.camera = camera;
    this.toolManager = toolManager;

    this.boundOnMouseDown = this.onMouseDown.bind(this);
    this.boundOnMouseMove = this.onMouseMove.bind(this);
    this.boundOnMouseUp = this.onMouseUp.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnContextMenu = this.onContextMenu.bind(this);
    this.boundOnKeyDown = this.onKeyDown.bind(this);
    this.boundOnKeyUp = this.onKeyUp.bind(this);

    this.attachListeners();
  }

  private attachListeners(): void {
    const c = this.canvas;
    c.addEventListener('mousedown', this.boundOnMouseDown);
    c.addEventListener('mousemove', this.boundOnMouseMove);
    c.addEventListener('mouseup', this.boundOnMouseUp);
    c.addEventListener('wheel', this.boundOnWheel, { passive: false });
    c.addEventListener('contextmenu', this.boundOnContextMenu);
    window.addEventListener('keydown', this.boundOnKeyDown);
    window.addEventListener('keyup', this.boundOnKeyUp);
  }

  private removeListeners(): void {
    const c = this.canvas;
    c.removeEventListener('mousedown', this.boundOnMouseDown);
    c.removeEventListener('mousemove', this.boundOnMouseMove);
    c.removeEventListener('mouseup', this.boundOnMouseUp);
    c.removeEventListener('wheel', this.boundOnWheel);
    c.removeEventListener('contextmenu', this.boundOnContextMenu);
    window.removeEventListener('keydown', this.boundOnKeyDown);
    window.removeEventListener('keyup', this.boundOnKeyUp);
  }

  private getCanvasCoords(e: MouseEvent): [number, number] {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return [(e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY];
  }

  private screenToWorld(sx: number, sy: number): [number, number] {
    return this.camera.screenToWorld(sx, sy);
  }

  private makeToolEvent(e: MouseEvent) {
    const [sx, sy] = this.getCanvasCoords(e);
    const [wx, wy] = this.screenToWorld(sx, sy);
    const canvasMode = editorStore.getState().canvasMode;
    const snapX = canvasMode === 'free' ? wx : Math.round(wx);
    const snapY = canvasMode === 'free' ? wy : Math.round(wy);
    return {
      screenX: sx,
      screenY: sy,
      worldX: wx,
      worldY: wy,
      gridX: snapX,
      gridY: snapY,
      button: e.button,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
    };
  }

  private onMouseDown = (e: MouseEvent): void => {
    if (e.button === 1 || (e.button === 0 && this.spaceDown)) {
      this.panning = true;
      [this.lastMouseX, this.lastMouseY] = this.getCanvasCoords(e);
      e.preventDefault();
      return;
    }

    if (e.button === 0 || e.button === 2) {
      this.toolManager.onPointerDown(this.makeToolEvent(e));
    }
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (this.panning) {
      const [cx, cy] = this.getCanvasCoords(e);
      const dx = cx - this.lastMouseX;
      const dy = cy - this.lastMouseY;
      this.lastMouseX = cx;
      this.lastMouseY = cy;
      const worldDx = dx / this.camera.zoom;
      const worldDy = dy / this.camera.zoom;
      this.camera.pan(worldDx, worldDy);
      return;
    }

    const evt = this.makeToolEvent(e);
    editorStore.getState().setCursor(Math.round(evt.worldX), Math.round(evt.worldY));
    this.toolManager.onPointerMove(evt);
  };

  private onMouseUp = (e: MouseEvent): void => {
    if (e.button === 1 || (e.button === 0 && this.spaceDown)) {
      this.panning = false;
      return;
    }

    if (e.button === 0 || e.button === 2) {
      this.toolManager.onPointerUp(this.makeToolEvent(e));
    }
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const [cx, cy] = this.getCanvasCoords(e);
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    this.camera.zoomAt(cx, cy, factor);
  };

  private onContextMenu = (e: Event): void => {
    e.preventDefault();
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    const keyStr = normalizeKey(e);
    const action = useKeybindingStore.getState().getActionForKey(keyStr);
    if (action) {
      const handler = this.actionHandlers[action];
      if (handler) {
        e.preventDefault();
        handler();
        return;
      }
    }

    // Space pan is the default behavior when not bound to another action
    if (e.code === 'Space') {
      this.spaceDown = true;
      e.preventDefault();
      return;
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    if (e.code === 'Space') {
      this.spaceDown = false;
    }
  };

  private async handleDelete(): Promise<void> {
    const state = editorStore.getState();
    const selectedIds = state.selectedIds;
    if (selectedIds.size === 0) return;

    const cmds: (DeleteComponentCmd | DeleteWireCmd)[] = [];

    for (const id of selectedIds) {
      const comp = state.components.get(id);
      if (comp) {
        cmds.push(new DeleteComponentCmd(id));
      } else {
        const wire = state.wires.get(id);
        if (wire) {
          cmds.push(new DeleteWireCmd(id));
        }
      }
    }

    if (cmds.length > 0) {
      await historyStore.getState().execute(new CompositeCmd(cmds));
      editorStore.getState().clearSelection();
    }
  }

  destroy(): void {
    this.removeListeners();
    this.toolManager.destroy();
  }
}
