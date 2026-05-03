export interface CanvasPointerEvent {
  screenX: number;
  screenY: number;
  worldX: number;
  worldY: number;
  gridX: number;
  gridY: number;
  button: number;
  shiftKey: boolean;
  ctrlKey: boolean;
}

export interface Tool {
  onPointerDown(e: CanvasPointerEvent): void;
  onPointerMove(e: CanvasPointerEvent): void;
  onPointerUp(e: CanvasPointerEvent): void;
  onActivate(): void;
  onDeactivate(): void;
}
