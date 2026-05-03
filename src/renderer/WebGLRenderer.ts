import { Camera } from './Camera';
import { GridLayer } from './GridLayer';
import { TextureAtlas } from './TextureAtlas';
import { ComponentLayer } from './ComponentLayer';
import { SelectionLayer } from './SelectionLayer';
import { WireLayer } from './WireLayer';
import { editorStore } from '../stores/editorStore';
import { simulationStore } from '../stores/simulationStore';
import { useThemeStore } from '../stores/themeStore';
import type { ComponentKind } from '../types/circuit';

function parseHexCSS(hex: string): [number, number, number] {
  const h = hex.trim();
  if (h.startsWith('#')) {
    const r = parseInt(h.slice(1, 3), 16) / 255;
    const g = parseInt(h.slice(3, 5), 16) / 255;
    const b = parseInt(h.slice(5, 7), 16) / 255;
    return [r, g, b];
  }
  return [0.1, 0.1, 0.15];
}

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

interface WireSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export class WebGLRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private camera: Camera;
  private gridLayer: GridLayer;
  private textureAtlas: TextureAtlas;
  private componentLayer: ComponentLayer;
  private selectionLayer: SelectionLayer;
  private wireLayer: WireLayer;
  private animFrameId: number | null = null;
  private running = false;
  private dirty = true;
  private unsubscribe: () => void;
  private simUnsubscribe: () => void;
  private themeUnsubscribe: () => void;
  private clearColor: [number, number, number] = [0.118, 0.118, 0.180];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2', { antialias: false });
    if (!gl) {
      throw new Error('WebGL2 not supported');
    }
    this.gl = gl;
    this.camera = new Camera();
    this.gridLayer = new GridLayer(gl);
    this.textureAtlas = new TextureAtlas(gl);
    this.componentLayer = new ComponentLayer(gl, this.textureAtlas);
    this.selectionLayer = new SelectionLayer(gl);
    this.wireLayer = new WireLayer(gl);

    this.unsubscribe = editorStore.subscribe(() => { this.dirty = true; });
    this.simUnsubscribe = simulationStore.subscribe(() => { this.dirty = true; });
    this.themeUnsubscribe = useThemeStore.subscribe(() => { this.updateThemeColors(); this.dirty = true; });
    this.updateThemeColors();
  }

  private updateThemeColors(): void {
    const theme = useThemeStore.getState().theme;
    const bg = parseHexCSS(cssVar('--bg-primary'));
    const minor = parseHexCSS(cssVar('--bg-tertiary'));
    const major = parseHexCSS(cssVar('--border'));
    const axis = parseHexCSS(cssVar('--accent'));
    this.clearColor = bg;
    this.gridLayer.setColors(bg, minor, major, axis);
    this.textureAtlas.regenerate(theme);
  }

  getCamera(): Camera {
    return this.camera;
  }

  getGL(): WebGL2RenderingContext {
    return this.gl;
  }

  setGhostComponent(kind: ComponentKind, x: number, y: number): void {
    this.componentLayer.setGhostComponent(kind, x, y);
  }

  clearGhostComponent(): void {
    this.componentLayer.clearGhostComponent();
  }

  setWirePreview(segments: WireSegment[]): void {
    this.wireLayer.setWirePreview(segments);
  }

  clearWirePreview(): void {
    this.wireLayer.clearWirePreview();
  }

  setBoxSelectRect(x1: number, y1: number, x2: number, y2: number): void {
    this.selectionLayer.setSelectionRect(x1, y1, x2, y2);
  }

  clearBoxSelectRect(): void {
    this.selectionLayer.clearSelectionRect();
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    const loop = (): void => {
      if (!this.running) return;
      if (this.dirty) {
        this.render();
        this.dirty = false;
      }
      this.animFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  resize(width: number, height: number): void {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.floor(width * dpr);
    const h = Math.floor(height * dpr);
    this.canvas.width = w;
    this.canvas.height = h;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.camera.canvasWidth = w;
    this.camera.canvasHeight = h;
  }

  private render(): void {
    const gl = this.gl;
    gl.viewport(0, 0, this.camera.canvasWidth, this.camera.canvasHeight);
    gl.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const state = editorStore.getState();
    const gridOpacity = state.canvasMode === 'free' ? 0.3 : 1.0;
    this.gridLayer.setOpacity(gridOpacity);

    this.gridLayer.draw(this.camera);

    this.componentLayer.updateInstances(state.components, state.pins);
    this.componentLayer.draw(this.camera);
    this.wireLayer.draw(this.camera);
    this.selectionLayer.draw(this.camera);
  }

  destroy(): void {
    this.running = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.unsubscribe();
    this.simUnsubscribe();
    this.themeUnsubscribe();
    this.gridLayer.destroy();
    this.componentLayer.destroy();
    this.selectionLayer.destroy();
    this.wireLayer.destroy();
    this.textureAtlas.destroy();
  }
}
