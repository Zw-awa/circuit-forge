import { ShaderProgram } from './ShaderProgram';
import { Camera } from './Camera';
import { editorStore } from '../stores/editorStore';
import selectVertSource from './shaders/selection.vert.glsl?raw';
import selectFragSource from './shaders/selection.frag.glsl?raw';

interface SelectionInstance {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  g: number;
  b: number;
  a: number;
}

const MAX_SELECTIONS = 4096;

export class SelectionLayer {
  private gl: WebGL2RenderingContext;
  private program: ShaderProgram;
  private vao: WebGLVertexArrayObject;
  private instanceVao: WebGLVertexArrayObject;
  private instanceBuffer!: WebGLBuffer;
  private instances: SelectionInstance[] = [];
  private boxRect: { x1: number; y1: number; x2: number; y2: number } | null = null;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.program = new ShaderProgram(gl, selectVertSource, selectFragSource);

    this.vao = gl.createVertexArray()!;
    this.setupBaseGeometry();

    this.instanceVao = gl.createVertexArray()!;
    this.setupInstancing();
  }

  private setupBaseGeometry(): void {
    const gl = this.gl;
    gl.bindVertexArray(this.vao);

    const vertices = new Float32Array([
      -0.5, -0.5,
      -0.5, 0.5,
      0.5, -0.5,
      0.5, 0.5,
    ]);

    const posBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const aPosition = this.program.getAttribLocation('a_position');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
  }

  private setupInstancing(): void {
    const gl = this.gl;
    gl.bindVertexArray(this.instanceVao);

    const baseVerts = new Float32Array([
      -0.5, -0.5,
      -0.5, 0.5,
      0.5, -0.5,
      0.5, 0.5,
    ]);
    const baseBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, baseBuf);
    gl.bufferData(gl.ARRAY_BUFFER, baseVerts, gl.STATIC_DRAW);

    const aPosition = this.program.getAttribLocation('a_position');
    if (aPosition >= 0) {
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
    }

    const stride = 8 * Float32Array.BYTES_PER_ELEMENT;
    this.instanceBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, MAX_SELECTIONS * stride, gl.DYNAMIC_DRAW);

    const instanceAttribs: Record<string, number> = {
      a_offset: 0,
      a_size: 2 * Float32Array.BYTES_PER_ELEMENT,
      a_color: 4 * Float32Array.BYTES_PER_ELEMENT,
    };

    for (const [name, offset] of Object.entries(instanceAttribs)) {
      const loc = this.program.getAttribLocation(name);
      if (loc < 0) continue;
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, name === 'a_color' ? 4 : 2, gl.FLOAT, false, stride, offset);
      gl.vertexAttribDivisor(loc, 1);
    }

    gl.bindVertexArray(null);
  }

  setSelectionRect(x1: number, y1: number, x2: number, y2: number): void {
    this.boxRect = { x1, y1, x2, y2 };
  }

  clearSelectionRect(): void {
    this.boxRect = null;
  }

  private buildInstances(): void {
    const state = editorStore.getState();
    const components = state.components;
    const selectedIds = state.selectedIds;
    const hoveredId = state.hoveredId;

    this.instances = [];

    for (const id of selectedIds) {
      const comp = components.get(id);
      if (!comp || this.instances.length >= MAX_SELECTIONS) continue;
      this.instances.push({
        x: comp.x,
        y: comp.y,
        w: 2.0,
        h: 2.0,
        r: 0.486,
        g: 0.435,
        b: 0.941,
        a: 0.2,
      });
    }

    if (hoveredId !== null && !selectedIds.has(hoveredId)) {
      const comp = components.get(hoveredId);
      if (comp && this.instances.length < MAX_SELECTIONS) {
        this.instances.push({
          x: comp.x,
          y: comp.y,
          w: 2.0,
          h: 2.0,
          r: 0.8,
          g: 0.8,
          b: 0.4,
          a: 0.15,
        });
      }
    }

    if (this.boxRect && this.instances.length < MAX_SELECTIONS) {
      const cx = (this.boxRect.x1 + this.boxRect.x2) / 2;
      const cy = (this.boxRect.y1 + this.boxRect.y2) / 2;
      const w = Math.abs(this.boxRect.x2 - this.boxRect.x1);
      const h = Math.abs(this.boxRect.y2 - this.boxRect.y1);
      this.instances.push({
        x: cx,
        y: cy,
        w,
        h,
        r: 0.2,
        g: 0.4,
        b: 0.9,
        a: 0.15,
      });
    }
  }

  draw(camera: Camera): void {
    this.buildInstances();
    if (this.instances.length === 0) return;

    const gl = this.gl;
    this.program.use();
    this.program.setUniformMatrix4fv('u_projection', camera.getProjectionMatrix());

    gl.bindVertexArray(this.instanceVao);
    this.uploadInstances();
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.instances.length);
    gl.bindVertexArray(null);
  }

  private uploadInstances(): void {
    const gl = this.gl;
    const data = new Float32Array(this.instances.length * 8);
    for (let i = 0; i < this.instances.length; i++) {
      const inst = this.instances[i];
      const base = i * 8;
      data[base] = inst.x;
      data[base + 1] = inst.y;
      data[base + 2] = inst.w;
      data[base + 3] = inst.h;
      data[base + 4] = inst.r;
      data[base + 5] = inst.g;
      data[base + 6] = inst.b;
      data[base + 7] = inst.a;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
  }

  destroy(): void {
    const gl = this.gl;
    gl.deleteVertexArray(this.vao);
    gl.deleteVertexArray(this.instanceVao);
    gl.deleteBuffer(this.instanceBuffer);
    this.program.destroy();
  }
}
