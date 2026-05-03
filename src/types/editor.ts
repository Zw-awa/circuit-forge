export type ToolType = 'select' | 'place' | 'wire' | 'delete';

export interface Viewport {
  centerX: number;
  centerY: number;
  zoom: number;
}

export type CanvasMode = 'grid' | 'free';

export interface EditorStateExtras {
  canvasMode: CanvasMode;
  activeWireColor?: number;
}
