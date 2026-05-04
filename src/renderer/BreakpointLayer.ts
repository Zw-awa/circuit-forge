import { ShaderProgram } from './ShaderProgram';
import { Camera } from './Camera';
import { useDebugStore } from '../stores/debugStore';
import { editorStore } from '../stores/editorStore';
import bpVertSource from './shaders/breakpoint.vert.glsl?raw';
import bpFragSource from './shaders/breakpoint.frag.glsl?raw';

interface BpInstance {
  x: number;
  y: number;
  size: number;
}

const MAX_BREAKPOINTS = 1024;
const DIAMOND_SIZE = 0.4;

export class BreakpointLayer {
  private gl: WebGL2RenderingContext;
  private program: ShaderProgram;
  private vao: WebGLVertexArrayObject;
  private instanceBuffer!: WebGLBuffer;
  private instances: BpInstance[] = [];

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.program = new ShaderProgram(gl, bpVertSource, bpFragSource);

    this.vao = gl.createVertexArray()!;
    this.setupGeometry();
  }

  private setupGeometry(): void {
    const gl = this.gl;
    gl.bindVertexArray(this.vao);

    const diamondVerts = new Float32Array([
      0.0, -0.5,
      0.5, 0.0,
      0.0, 0.5,
      -0.5, 0.0,
    ]);

    const vertBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, diamondVerts, gl.STATIC_DRAW);

    const aVertex = this.program.getAttribLocation('a_vertex');
    gl.enableVertexAttribArray(aVertex);
    gl.vertexAttribPointer(aVertex, 2, gl.FLOAT, false, 0, 0);

    this.instanceBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, MAX_BREAKPOINTS * 4 * 4, gl.DYNAMIC_DRAW);

    const aPosition = this.program.getAttribLocation('a_position');
    const aSize = this.program.getAttribLocation('a_size');

    const stride = 4 * 3;
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, stride, 0);
    gl.vertexAttribDivisor(aPosition, 1);

    gl.enableVertexAttribArray(aSize);
    gl.vertexAttribPointer(aSize, 1, gl.FLOAT, false, stride, 2 * 4);
    gl.vertexAttribDivisor(aSize, 1);

    gl.bindVertexArray(null);
  }

  private collectInstances(): void {
    this.instances = [];
    const breakpoints = useDebugStore.getState().breakpoints.filter((bp) => bp.enabled);
    const components = editorStore.getState().components;
    const wires = editorStore.getState().wires;
    const pins = editorStore.getState().pins;

    for (const bp of breakpoints) {
      let x = 0;
      let y = 0;
      let found = false;

      if ('Net' in bp.target) {
        const netId = bp.target.Net;
        for (const pin of pins.values()) {
          if (pin.netId === netId) {
            const comp = components.get(pin.ownerId);
            if (comp) {
              x = comp.x + pin.offsetX;
              y = comp.y + pin.offsetY;
              found = true;
              break;
            }
          }
        }
        if (!found) {
          for (const wire of wires.values()) {
            if (wire.netId === netId) {
              let sx = 0, sy = 0, ex = 0, ey = 0;
              let gotStart = false, gotEnd = false;
              if (wire.start.type === 'pin') {
                const sp = pins.get(wire.start.id);
                if (sp) { const sc = components.get(sp.ownerId); if (sc) { sx = sc.x + sp.offsetX; sy = sc.y + sp.offsetY; gotStart = true; } }
              }
              if (wire.end.type === 'pin') {
                const ep = pins.get(wire.end.id);
                if (ep) { const ec = components.get(ep.ownerId); if (ec) { ex = ec.x + ep.offsetX; ey = ec.y + ep.offsetY; gotEnd = true; } }
              }
              if (gotStart && gotEnd) {
                x = (sx + ex) / 2;
                y = (sy + ey) / 2;
                found = true;
                break;
              }
            }
          }
        }
      } else if ('Component' in bp.target) {
        const comp = components.get(bp.target.Component);
        if (comp) {
          x = comp.x;
          y = comp.y;
          found = true;
        }
      }

      if (found) {
        this.instances.push({ x, y, size: DIAMOND_SIZE });
      }
    }
  }

  render(camera: Camera): void {
    this.collectInstances();
    if (this.instances.length === 0) return;

    const gl = this.gl;
    this.program.use();

    this.program.setUniformMatrix4fv('u_projection', camera.getProjectionMatrix());

    gl.bindVertexArray(this.vao);

    const floatData = new Float32Array(this.instances.length * 3);
    for (let i = 0; i < this.instances.length; i++) {
      const inst = this.instances[i];
      const offset = i * 3;
      floatData[offset] = inst.x;
      floatData[offset + 1] = inst.y;
      floatData[offset + 2] = inst.size;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, floatData);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, 4, this.instances.length);
    gl.disable(gl.BLEND);

    gl.bindVertexArray(null);
  }

  destroy(): void {
    this.program.destroy();
    this.gl.deleteVertexArray(this.vao);
    this.gl.deleteBuffer(this.instanceBuffer);
  }
}
