import { ShaderProgram } from './ShaderProgram';
import { Camera } from './Camera';
import { TextureAtlas } from './TextureAtlas';
import { editorStore } from '../stores/editorStore';
import { simulationStore } from '../stores/simulationStore';
import type { CircuitComponent, Pin } from '../types/circuit';
import type { ComponentKind } from '../types/circuit';
import spriteVertSource from './shaders/sprite.vert.glsl?raw';
import spriteFragSource from './shaders/sprite.frag.glsl?raw';

interface ComponentInstance {
  x: number;
  y: number;
  size: number;
  u0: number;
  v0: number;
  u1: number;
  v1: number;
  tintR: number;
  tintG: number;
  tintB: number;
  tintA: number;
}

interface PinInstance {
  x: number;
  y: number;
  size: number;
  tintR: number;
  tintG: number;
  tintB: number;
  tintA: number;
}

const MAX_COMPONENTS = 4096;
const MAX_PINS = 8192;

const ALL_COMPONENT_KINDS: ComponentKind[] = [
  'And', 'Or', 'Not', 'Nand', 'Xor', 'Switch', 'Led',
  'Button', 'Clock', 'Random', 'Constant', 'SevenSegment',
  'Oscilloscope', 'DelayLine', 'Splitter', 'Merger',
];

export class ComponentLayer {
  private gl: WebGL2RenderingContext;
  private program: ShaderProgram;
  private vao: WebGLVertexArrayObject;
  private instanceVao: WebGLVertexArrayObject;
  private instanceBuffer!: WebGLBuffer;
  private pinInstanceVao: WebGLVertexArrayObject;
  private pinInstanceBuffer!: WebGLBuffer;
  private componentInstances: ComponentInstance[] = [];
  private pinInstances: PinInstance[] = [];
  private ghostComponent: ComponentInstance | null = null;
  private atlas: TextureAtlas;
  private instancesDirty = true;

  constructor(gl: WebGL2RenderingContext, atlas: TextureAtlas) {
    this.gl = gl;
    this.atlas = atlas;
    this.program = new ShaderProgram(gl, spriteVertSource, spriteFragSource);

    this.vao = gl.createVertexArray()!;
    this.instanceVao = gl.createVertexArray()!;
    this.pinInstanceVao = gl.createVertexArray()!;

    this.setupBaseGeometry();
    this.setupComponentInstancing();
    this.setupPinInstancing();
  }

  private setupBaseGeometry(): void {
    const gl = this.gl;
    gl.bindVertexArray(this.vao);

    const vertices = new Float32Array([
      -0.5, -0.5, 0, 1,
      -0.5, 0.5, 0, 0,
      0.5, -0.5, 1, 1,
      0.5, 0.5, 1, 0,
    ]);

    const posBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const stride = 4 * Float32Array.BYTES_PER_ELEMENT;
    const aPosition = this.program.getAttribLocation('a_position');
    const aTexCoord = this.program.getAttribLocation('a_texcoord');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(aTexCoord);
    gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);

    gl.bindVertexArray(null);
  }

  private setupComponentInstancing(): void {
    const gl = this.gl;
    gl.bindVertexArray(this.instanceVao);

    const baseVerts = new Float32Array([
      -0.5, -0.5, 0, 1,
      -0.5, 0.5, 0, 0,
      0.5, -0.5, 1, 1,
      0.5, 0.5, 1, 0,
    ]);
    const baseBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, baseBuf);
    gl.bufferData(gl.ARRAY_BUFFER, baseVerts, gl.STATIC_DRAW);

    const baseStride = 4 * Float32Array.BYTES_PER_ELEMENT;
    const aPosition = this.program.getAttribLocation('a_position');
    const aTexCoord = this.program.getAttribLocation('a_texcoord');
    if (aPosition >= 0) {
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, baseStride, 0);
    }
    if (aTexCoord >= 0) {
      gl.enableVertexAttribArray(aTexCoord);
      gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, baseStride, 2 * Float32Array.BYTES_PER_ELEMENT);
    }

    const stride = 12 * Float32Array.BYTES_PER_ELEMENT;
    this.instanceBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, MAX_COMPONENTS * stride, gl.DYNAMIC_DRAW);

    const offsets: Record<string, number> = {
      a_offset: 0,
      a_size: 2 * Float32Array.BYTES_PER_ELEMENT,
      a_uvRect: 4 * Float32Array.BYTES_PER_ELEMENT,
      a_tint: 8 * Float32Array.BYTES_PER_ELEMENT,
    };

    for (const [name, offset] of Object.entries(offsets)) {
      const loc = this.program.getAttribLocation(name);
      if (loc < 0) continue;
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, name === 'a_uvRect' || name === 'a_tint' ? 4 : 2, gl.FLOAT, false, stride, offset);
      gl.vertexAttribDivisor(loc, 1);
    }

    gl.bindVertexArray(null);
  }

  private setupPinInstancing(): void {
    const gl = this.gl;
    gl.bindVertexArray(this.pinInstanceVao);

    const baseVerts = new Float32Array([
      -0.5, -0.5, 0, 1,
      -0.5, 0.5, 0, 0,
      0.5, -0.5, 1, 1,
      0.5, 0.5, 1, 0,
    ]);
    const baseBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, baseBuf);
    gl.bufferData(gl.ARRAY_BUFFER, baseVerts, gl.STATIC_DRAW);

    const baseStride = 4 * Float32Array.BYTES_PER_ELEMENT;
    const aPosition = this.program.getAttribLocation('a_position');
    const aTexCoord = this.program.getAttribLocation('a_texcoord');
    if (aPosition >= 0) {
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, baseStride, 0);
    }
    if (aTexCoord >= 0) {
      gl.enableVertexAttribArray(aTexCoord);
      gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, baseStride, 2 * Float32Array.BYTES_PER_ELEMENT);
    }

    const stride = 8 * Float32Array.BYTES_PER_ELEMENT;
    this.pinInstanceBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pinInstanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, MAX_PINS * stride, gl.DYNAMIC_DRAW);

    const pinOffsets: Record<string, number> = {
      a_offset: 0,
      a_size: 2 * Float32Array.BYTES_PER_ELEMENT,
      a_tint: 4 * Float32Array.BYTES_PER_ELEMENT,
    };

    for (const [name, offset] of Object.entries(pinOffsets)) {
      const loc = this.program.getAttribLocation(name);
      if (loc < 0) continue;
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, name === 'a_tint' ? 4 : 2, gl.FLOAT, false, stride, offset);
      gl.vertexAttribDivisor(loc, 1);
    }

    gl.bindVertexArray(null);
  }

  updateInstances(components: Map<number, CircuitComponent>, pins: Map<number, Pin>): void {
    if (!this.instancesDirty) return;
    this.instancesDirty = false;

    const signals = simulationStore.getState().signals;

    this.componentInstances = [];
    const kindAtlasMap = new Map<ComponentKind, { u0: number; v0: number; u1: number; v1: number }>();
    for (const kind of ALL_COMPONENT_KINDS) {
      kindAtlasMap.set(kind, this.atlas.getUV(kind));
    }

    const compArray = Array.from(components.values()).sort((a, b) => a.id - b.id);
    const wires = editorStore.getState().wires;
    for (const comp of compArray) {
      if (this.componentInstances.length >= MAX_COMPONENTS) break;
      const uv = kindAtlasMap.get(comp.kind) ?? { u0: 0, v0: 0, u1: 1, v1: 1 };

      let tintR = 1.0;
      let tintG = 1.0;
      let tintB = 1.0;
      let tintA = 1.0;

      if (comp.kind === 'Led') {
        let netId: number | null = null;
        for (const wire of wires.values()) {
          if (comp.inputPins.includes(wire.start.id) || comp.inputPins.includes(wire.end.id)) {
            netId = wire.netId;
            break;
          }
        }
        if (netId !== null && signals.has(netId)) {
          const signal = signals.get(netId);
          if (signal === 'High') {
            tintR = 0.29;
            tintG = 0.87;
            tintB = 0.50;
            tintA = 1.0;
          } else {
            tintR = 0.42;
            tintG = 0.45;
            tintB = 0.51;
            tintA = 1.0;
          }
        } else {
          tintR = 0.42;
          tintG = 0.45;
          tintB = 0.51;
          tintA = 1.0;
        }
      }

      if (comp.kind === 'Button') {
        if (comp.pressState) {
          tintR = 0.7;
          tintG = 0.7;
          tintB = 0.7;
          tintA = 1.0;
        }
      }

      if (comp.kind === 'SevenSegment') {
        // Render with slight green tint when active
        let hasHighInput = false;
        for (const wire of wires.values()) {
          for (const inputPinId of comp.inputPins) {
            if ((wire.start.id === inputPinId || wire.end.id === inputPinId)) {
              const sig = signals.get(wire.netId);
              if (sig === 'High') {
                hasHighInput = true;
                break;
              }
            }
          }
          if (hasHighInput) break;
        }
        if (hasHighInput) {
          tintR = 0.29;
          tintG = 0.87;
          tintB = 0.50;
          tintA = 1.0;
        }
      }

      this.componentInstances.push({
        x: comp.x,
        y: comp.y,
        size: 2.0,
        u0: uv.u0,
        v0: uv.v0,
        u1: uv.u1,
        v1: uv.v1,
        tintR,
        tintG,
        tintB,
        tintA,
      });
    }

    this.pinInstances = [];
    const pinArray = Array.from(pins.values()).sort((a, b) => a.id - b.id);
    for (const pin of pinArray) {
      if (this.pinInstances.length >= MAX_PINS) break;

      const owner = components.get(pin.ownerId);
      if (!owner) continue;

      let netId: number | null = null;
      for (const wire of editorStore.getState().wires.values()) {
        if (wire.start.id === pin.id || wire.end.id === pin.id) {
          netId = wire.netId;
          break;
        }
      }

      let tintR = 0.29;
      let tintG = 0.87;
      let tintB = 0.50;
      let tintA = 0.9;

      if (netId !== null && signals.has(netId)) {
        const signal = signals.get(netId);
        if (signal === 'High') {
          tintR = 0.29;
          tintG = 0.87;
          tintB = 0.50;
          tintA = 1.0;
        } else {
          tintR = 0.42;
          tintG = 0.45;
          tintB = 0.51;
          tintA = 1.0;
        }
      }

      this.pinInstances.push({
        x: pin.worldX,
        y: pin.worldY,
        size: 0.15,
        tintR,
        tintG,
        tintB,
        tintA,
      });
    }
  }

  draw(camera: Camera): void {
    const gl = this.gl;
    this.program.use();
    this.program.setUniformMatrix4fv('u_projection', camera.getProjectionMatrix());
    this.atlas.bind(gl, 0);

    const atlasLoc = gl.getUniformLocation(this.program.getProgram(), 'u_atlas');
    if (atlasLoc !== null) {
      gl.uniform1i(atlasLoc, 0);
    }

    if (this.componentInstances.length > 0) {
      gl.bindVertexArray(this.instanceVao);
      this.uploadComponentInstances();
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.componentInstances.length);
    }

    if (this.pinInstances.length > 0) {
      gl.bindVertexArray(this.pinInstanceVao);
      this.uploadPinInstances();
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.pinInstances.length);
    }

    if (this.ghostComponent !== null) {
      gl.bindVertexArray(this.instanceVao);
      this.uploadGhostInstance();
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, 1);
    }

    gl.bindVertexArray(null);
  }

  setGhostComponent(kind: ComponentKind, x: number, y: number): void {
    const uv = this.atlas.getUV(kind);
    this.ghostComponent = {
      x,
      y,
      size: 2.0,
      u0: uv.u0,
      v0: uv.v0,
      u1: uv.u1,
      v1: uv.v1,
      tintR: 1.0,
      tintG: 1.0,
      tintB: 1.0,
      tintA: 0.5,
    };
  }

  clearGhostComponent(): void {
    this.ghostComponent = null;
  }

  markDirty(): void {
    this.instancesDirty = true;
  }

  private uploadGhostInstance(): void {
    const gl = this.gl;
    const inst = this.ghostComponent!;
    const data = new Float32Array(12);
    data[0] = inst.x;
    data[1] = inst.y;
    data[2] = inst.size;
    data[3] = inst.size;
    data[4] = inst.u0;
    data[5] = inst.v0;
    data[6] = inst.u1 - inst.u0;
    data[7] = inst.v1 - inst.v0;
    data[8] = inst.tintR;
    data[9] = inst.tintG;
    data[10] = inst.tintB;
    data[11] = inst.tintA;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
  }

  private uploadComponentInstances(): void {
    const gl = this.gl;
    const data = new Float32Array(this.componentInstances.length * 12);
    for (let i = 0; i < this.componentInstances.length; i++) {
      const inst = this.componentInstances[i];
      const base = i * 12;
      data[base] = inst.x;
      data[base + 1] = inst.y;
      data[base + 2] = inst.size;
      data[base + 3] = inst.size;
      data[base + 4] = inst.u0;
      data[base + 5] = inst.v0;
      data[base + 6] = inst.u1 - inst.u0;
      data[base + 7] = inst.v1 - inst.v0;
      data[base + 8] = inst.tintR;
      data[base + 9] = inst.tintG;
      data[base + 10] = inst.tintB;
      data[base + 11] = inst.tintA;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
  }

  private uploadPinInstances(): void {
    const gl = this.gl;
    const data = new Float32Array(this.pinInstances.length * 8);
    for (let i = 0; i < this.pinInstances.length; i++) {
      const inst = this.pinInstances[i];
      const base = i * 8;
      data[base] = inst.x;
      data[base + 1] = inst.y;
      data[base + 2] = inst.size;
      data[base + 3] = inst.size;
      data[base + 4] = inst.tintR;
      data[base + 5] = inst.tintG;
      data[base + 6] = inst.tintB;
      data[base + 7] = inst.tintA;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pinInstanceBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
  }

  destroy(): void {
    const gl = this.gl;
    gl.deleteVertexArray(this.vao);
    gl.deleteVertexArray(this.instanceVao);
    gl.deleteVertexArray(this.pinInstanceVao);
    gl.deleteBuffer(this.instanceBuffer);
    gl.deleteBuffer(this.pinInstanceBuffer);
    this.program.destroy();
  }
}
