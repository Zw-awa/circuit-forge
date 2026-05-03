import type { Tool, CanvasPointerEvent } from './Tool';
import type { ToolType } from '../types/editor';
import { editorStore } from '../stores/editorStore';
import { Picker } from './Picker';
import { WebGLRenderer } from '../renderer/WebGLRenderer';
import { PlaceTool } from './tools/PlaceTool';
import { SelectTool } from './tools/SelectTool';
import { WireTool } from './tools/WireTool';
import { DeleteTool } from './tools/DeleteTool';

export class ToolManager {
  private tools: Map<ToolType, Tool>;
  private activeTool: Tool;
  private unsubscribe: () => void;

  constructor(picker: Picker, renderer: WebGLRenderer) {
    this.tools = new Map();
    this.tools.set('select', new SelectTool(picker, renderer));
    this.tools.set('place', new PlaceTool(picker, renderer));
    this.tools.set('wire', new WireTool(picker, renderer));
    this.tools.set('delete', new DeleteTool(picker, renderer));

    this.activeTool = this.tools.get('select')!;
    this.activeTool.onActivate();

    this.unsubscribe = editorStore.subscribe((state, prevState) => {
      if (state.activeTool !== prevState.activeTool) {
        this.switchTool(state.activeTool);
      }
    });
  }

  switchTool(toolType: ToolType): void {
    this.activeTool.onDeactivate();
    const tool = this.tools.get(toolType);
    if (!tool) return;
    this.activeTool = tool;
    this.activeTool.onActivate();
  }

  onPointerDown(e: CanvasPointerEvent): void {
    this.activeTool.onPointerDown(e);
  }

  onPointerMove(e: CanvasPointerEvent): void {
    this.activeTool.onPointerMove(e);
  }

  onPointerUp(e: CanvasPointerEvent): void {
    this.activeTool.onPointerUp(e);
  }

  destroy(): void {
    this.unsubscribe();
    this.activeTool.onDeactivate();
  }
}
