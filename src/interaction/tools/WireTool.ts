import type { Tool, CanvasPointerEvent } from '../Tool';
import { Picker } from '../Picker';
import { WebGLRenderer } from '../../renderer/WebGLRenderer';
import { editorStore } from '../../stores/editorStore';
import { historyStore } from '../../stores/historyStore';
import { AddWireCmd } from '../../commands/AddWireCmd';
import { SplitWireCmd } from '../../commands/SplitWireCmd';
import type { Pin, WireEndpoint } from '../../types/circuit';

export class WireTool implements Tool {
  private picker: Picker;
  private renderer: WebGLRenderer;

  private drawing = false;
  private startEndpoint: WireEndpoint | null = null;
  private startPin: Pin | null = null;
  private startJunctionX: number | null = null;
  private startJunctionY: number | null = null;

  constructor(picker: Picker, renderer: WebGLRenderer) {
    this.picker = picker;
    this.renderer = renderer;
  }

  onActivate(): void {
    this.renderer.clearGhostComponent();
  }

  onDeactivate(): void {
    this.reset();
  }

  private reset(): void {
    this.drawing = false;
    this.startEndpoint = null;
    this.startPin = null;
    this.startJunctionX = null;
    this.startJunctionY = null;
    this.renderer.clearWirePreview();
  }

  onPointerDown(e: CanvasPointerEvent): void {
    if (e.button === 2) {
      this.reset();
      editorStore.getState().setActiveTool('select');
      return;
    }
    if (e.button !== 0) return;

    const pinId = this.picker.hitTestPin(e.worldX, e.worldY);

    if (this.drawing) {
      if (pinId !== null) {
        const store = editorStore.getState();
        const targetPin = store.pins.get(pinId);
        if (targetPin && !targetPin.isOutput && this.startEndpoint !== null) {
          const cmd = new AddWireCmd(this.startEndpoint, { type: 'pin', id: pinId });
          historyStore.getState().execute(cmd);
        }
      }
      this.reset();
      return;
    }

    if (pinId !== null) {
      const store = editorStore.getState();
      const pin = store.pins.get(pinId);
      if (pin && pin.isOutput) {
        this.drawing = true;
        this.startEndpoint = { type: 'pin', id: pinId };
        this.startPin = pin;
        this.startJunctionX = null;
        this.startJunctionY = null;
        return;
      }
    }

    const wireResult = this.picker.getWireAt(e.worldX, e.worldY);
    if (wireResult !== null) {
      const store = editorStore.getState();
      const wire = store.wires.get(wireResult.wireId);
      if (wire) {
        const splitCmd = new SplitWireCmd(
          wireResult.wireId,
          wireResult.snapX,
          wireResult.snapY,
        );
        historyStore.getState().execute(splitCmd);

        const state = editorStore.getState();
        const jId = Array.from(state.junctions.values())
          .find(j => j.x === wireResult.snapX && j.y === wireResult.snapY)?.id;
        if (jId !== undefined) {
          this.drawing = true;
          this.startEndpoint = { type: 'junction', id: jId };
          this.startPin = null;
          this.startJunctionX = wireResult.snapX;
          this.startJunctionY = wireResult.snapY;
        }
        return;
      }
    }

    const junctionId = this.picker.hitTestJunction(e.worldX, e.worldY);
    if (junctionId !== null) {
      const junction = editorStore.getState().junctions.get(junctionId);
      if (junction) {
        this.drawing = true;
        this.startEndpoint = { type: 'junction', id: junctionId };
        this.startPin = null;
        this.startJunctionX = junction.x;
        this.startJunctionY = junction.y;
        return;
      }
    }
  }

  onPointerMove(e: CanvasPointerEvent): void {
    if (!this.drawing) return;

    const canvasMode = editorStore.getState().canvasMode;
    let ax: number;
    let ay: number;

    if (this.startPin) {
      ax = this.startPin.worldX;
      ay = this.startPin.worldY;
    } else if (this.startJunctionX !== null && this.startJunctionY !== null) {
      ax = this.startJunctionX;
      ay = this.startJunctionY;
    } else {
      return;
    }

    const bx = e.worldX;
    const by = e.worldY;

    if (canvasMode === 'free') {
      this.renderer.setWirePreview([
        { x1: ax, y1: ay, x2: bx, y2: by },
      ]);
    } else {
      this.renderer.setWirePreview([
        { x1: ax, y1: ay, x2: bx, y2: ay },
        { x1: bx, y1: ay, x2: bx, y2: by },
      ]);
    }
  }

  onPointerUp(_e: CanvasPointerEvent): void {}
}
