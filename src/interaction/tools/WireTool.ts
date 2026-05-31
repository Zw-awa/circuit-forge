import type { Tool, CanvasPointerEvent } from '../Tool';
import { Picker } from '../Picker';
import { WebGLRenderer } from '../../renderer/WebGLRenderer';
import { editorStore } from '../../stores/editorStore';
import { historyStore } from '../../stores/historyStore';
import { AddWireCmd } from '../../commands/AddWireCmd';
import { AddWaypointWireCmd } from '../../commands/AddWaypointWireCmd';
import { SplitWireCmd } from '../../commands/SplitWireCmd';
import type { Pin, WireEndpoint } from '../../types/circuit';

interface Waypoint {
  x: number;
  y: number;
}

export class WireTool implements Tool {
  private picker: Picker;
  private renderer: WebGLRenderer;

  private drawing = false;
  private startEndpoint: WireEndpoint | null = null;
  private startPin: Pin | null = null;
  private startJunctionX: number | null = null;
  private startJunctionY: number | null = null;
  private waypoints: Waypoint[] = [];

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
    this.waypoints = [];
    this.renderer.clearWirePreview();
  }

  private getStartCoords(): [number, number] | null {
    if (this.startPin) {
      return [this.startPin.worldX, this.startPin.worldY];
    }
    if (this.startJunctionX !== null && this.startJunctionY !== null) {
      return [this.startJunctionX, this.startJunctionY];
    }
    return null;
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
        const targetPin = editorStore.getState().pins.get(pinId);
        if (targetPin && this.startEndpoint !== null) {
          const color = editorStore.getState().activeWireColor;
          const end: WireEndpoint = { type: 'pin', id: pinId };
          if (this.waypoints.length > 0) {
            const cmd = new AddWaypointWireCmd(this.startEndpoint, end, [...this.waypoints], color);
            historyStore.getState().execute(cmd);
          } else {
            const cmd = new AddWireCmd(this.startEndpoint, end, color);
            historyStore.getState().execute(cmd);
          }
        }
      } else {
        // Clicked empty space while drawing — add a waypoint
        const canvasMode = editorStore.getState().canvasMode;
        const wx = canvasMode === 'free' ? e.worldX : Math.round(e.worldX);
        const wy = canvasMode === 'free' ? e.worldY : Math.round(e.worldY);
        this.waypoints.push({ x: wx, y: wy });
      }
      return;
    }

    // Not drawing — start a new wire
    if (pinId !== null) {
      const pin = editorStore.getState().pins.get(pinId);
      if (pin) {
        this.drawing = true;
        this.startEndpoint = { type: 'pin', id: pinId };
        this.startPin = pin;
        this.startJunctionX = null;
        this.startJunctionY = null;
        this.waypoints = [];
        return;
      }
    }

    const wireResult = this.picker.getWireAt(e.worldX, e.worldY);
    if (wireResult !== null) {
      const wire = editorStore.getState().wires.get(wireResult.wireId);
      if (wire) {
        const splitCmd = new SplitWireCmd(wireResult.wireId, wireResult.snapX, wireResult.snapY);
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
          this.waypoints = [];
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
        this.waypoints = [];
        return;
      }
    }
  }

  onPointerMove(e: CanvasPointerEvent): void {
    if (!this.drawing) return;

    const canvasMode = editorStore.getState().canvasMode;
    const color = editorStore.getState().activeWireColor;
    const start = this.getStartCoords();
    if (!start) return;

    const [ax, ay] = start;
    const segments: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

    let prevX = ax;
    let prevY = ay;

    // Segments through waypoints
    for (const wp of this.waypoints) {
      if (canvasMode === 'free') {
        segments.push({ x1: prevX, y1: prevY, x2: wp.x, y2: wp.y });
        prevX = wp.x;
        prevY = wp.y;
      } else {
        segments.push({ x1: prevX, y1: prevY, x2: wp.x, y2: prevY });
        segments.push({ x1: wp.x, y1: prevY, x2: wp.x, y2: wp.y });
        prevX = wp.x;
        prevY = wp.y;
      }
    }

    // Final segment to cursor
    const bx = e.worldX;
    const by = e.worldY;
    if (canvasMode === 'free') {
      segments.push({ x1: prevX, y1: prevY, x2: bx, y2: by });
    } else {
      segments.push({ x1: prevX, y1: prevY, x2: bx, y2: prevY });
      segments.push({ x1: bx, y1: prevY, x2: bx, y2: by });
    }

    this.renderer.setWirePreview(segments, color);
  }

  onPointerUp(_e: CanvasPointerEvent): void {}
}
