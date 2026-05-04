import { ShaderProgram } from './ShaderProgram';
import { Camera } from './Camera';
import { editorStore } from '../stores/editorStore';
import { simulationStore } from '../stores/simulationStore';
import { useSkinStore } from '../stores/skinStore';
import { resolveWireEndpointPosition } from '../utils/wireEndpointResolver';
import wireVertSource from './shaders/wire.vert.glsl?raw';
import wireFragSource from './shaders/wire.frag.glsl?raw';

interface WireSegmentInstance {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  thickness: number;
  r: number;
  g: number;
  b: number;
}

interface WireSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const MAX_SEGMENTS = 8192;

function computeLRouting(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  sourceIsRight: boolean,
): WireSegment[] {
  const segments: WireSegment[] = [];
  if (sourceIsRight) {
    if (Math.abs(bx - ax) < 0.01 || Math.abs(by - ay) < 0.01) {
      segments.push({ x1: ax, y1: ay, x2: bx, y2: by });
    } else {
      segments.push({ x1: ax, y1: ay, x2: bx, y2: ay });
      segments.push({ x1: bx, y1: ay, x2: bx, y2: by });
    }
  } else {
    if (Math.abs(bx - ax) < 0.01 || Math.abs(by - ay) < 0.01) {
      segments.push({ x1: ax, y1: ay, x2: bx, y2: by });
    } else {
      segments.push({ x1: ax, y1: ay, x2: ax, y2: by });
      segments.push({ x1: ax, y1: by, x2: bx, y2: by });
    }
  }
  return segments;
}

export class WireLayer {
  private gl: WebGL2RenderingContext;
  private program: ShaderProgram;
  private vao: WebGLVertexArrayObject;
  private instanceVao: WebGLVertexArrayObject;
  private instanceBuffer!: WebGLBuffer;
  private wireInstances: WireSegmentInstance[] = [];
  private previewSegments: WireSegment[] = [];
  private previewColor: [number, number, number] = [0.7, 0.7, 0.5];
  private instancesDirty = true;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.program = new ShaderProgram(gl, wireVertSource, wireFragSource);

    this.vao = gl.createVertexArray()!;
    this.setupBaseGeometry();

    this.instanceVao = gl.createVertexArray()!;
    this.setupInstancing();
  }

  private setupBaseGeometry(): void {
    const gl = this.gl;
    gl.bindVertexArray(this.vao);

    const vertices = new Float32Array([
      0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
      0.0, 1.0, 1.0, 0.0, 1.0, 1.0,
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
      0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
      0.0, 1.0, 1.0, 0.0, 1.0, 1.0,
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
    gl.bufferData(gl.ARRAY_BUFFER, MAX_SEGMENTS * stride, gl.DYNAMIC_DRAW);

    const instanceAttribs: Record<string, number> = {
      a_start: 0,
      a_end: 2 * Float32Array.BYTES_PER_ELEMENT,
      a_thickness: 4 * Float32Array.BYTES_PER_ELEMENT,
      a_color: 5 * Float32Array.BYTES_PER_ELEMENT,
    };

    for (const [name, offset] of Object.entries(instanceAttribs)) {
      const loc = this.program.getAttribLocation(name);
      if (loc < 0) continue;
      const size = name === 'a_color' ? 3 : (name === 'a_thickness' ? 1 : 2);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset);
      gl.vertexAttribDivisor(loc, 1);
    }

    gl.bindVertexArray(null);
  }

  private getWireColor(netId: number, customColor?: number): [number, number, number] {
    if (customColor && customColor !== 0) {
      const r = ((customColor >>> 16) & 0xFF) / 255;
      const g = ((customColor >>> 8) & 0xFF) / 255;
      const b = (customColor & 0xFF) / 255;
      return [r, g, b];
    }
    const skin = useSkinStore.getState().activeSkin;
    const signals = simulationStore.getState().signals;
    const signal = signals.get(netId);
    if (signal === 'High') {
      if (skin?.wire_style?.high_color) {
        const [hr, hg, hb] = skin.wire_style.high_color;
        return [hr, hg, hb];
      }
      return [0.29, 0.87, 0.50];
    }
    if (signal === 'Low') {
      if (skin?.wire_style?.low_color) {
        const [lr, lg, lb] = skin.wire_style.low_color;
        return [lr, lg, lb];
      }
      return [0.42, 0.45, 0.51];
    }
    return [0.227, 0.227, 0.314];
  }

  private buildWireInstances(): void {
    const state = editorStore.getState();
    const wires = state.wires;
    const pins = state.pins;
    const junctions = state.junctions;
    const skin = useSkinStore.getState().activeSkin;
    const wireThickness = skin?.wire_style?.thickness ?? 2.0;

    this.wireInstances = [];

    for (const wire of wires.values()) {
      const posA = resolveWireEndpointPosition(wire.start, pins, junctions);
      const posB = resolveWireEndpointPosition(wire.end, pins, junctions);
      if (!posA || !posB) continue;

      const sourceIsRight = posA.isOutput;
      const ax = posA.x;
      const ay = posA.y;
      const bx = posB.x;
      const by = posB.y;

      const segments = computeLRouting(ax, ay, bx, by, sourceIsRight);
      const [r, g, b] = this.getWireColor(wire.netId, wire.color);

      for (const seg of segments) {
        if (this.wireInstances.length >= MAX_SEGMENTS) break;
        this.wireInstances.push({
          startX: seg.x1,
          startY: seg.y1,
          endX: seg.x2,
          endY: seg.y2,
          thickness: wireThickness,
          r,
          g,
          b,
        });
      }
    }
  }

  setWirePreview(segments: WireSegment[]): void {
    this.previewSegments = segments;
  }

  clearWirePreview(): void {
    this.previewSegments = [];
  }

  markDirty(): void {
    this.instancesDirty = true;
  }

  draw(camera: Camera): void {
    if (this.instancesDirty) {
      this.buildWireInstances();
      this.instancesDirty = false;
    }

    const gl = this.gl;
    const skin = useSkinStore.getState().activeSkin;
    const dashLen = skin?.wire_style?.dash_length ?? 0.0;
    const gapLen = skin?.wire_style?.gap_length ?? 0.0;
    const glowIntensity = skin?.wire_style?.glow_intensity ?? 0.0;

    this.program.use();
    this.program.setUniformMatrix4fv('u_projection', camera.getProjectionMatrix());
    this.program.setUniform2f('u_resolution', camera.canvasWidth, camera.canvasHeight);
    this.program.setUniform1f('u_dashLength', dashLen);
    this.program.setUniform1f('u_gapLength', gapLen);
    this.program.setUniform1f('u_glowIntensity', glowIntensity);

    gl.bindVertexArray(this.instanceVao);

    if (this.wireInstances.length > 0) {
      this.uploadInstances(this.wireInstances);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this.wireInstances.length);
    }

    const previewInstances: WireSegmentInstance[] = this.previewSegments.map((seg) => ({
      startX: seg.x1,
      startY: seg.y1,
      endX: seg.x2,
      endY: seg.y2,
      thickness: 2.0,
      r: this.previewColor[0],
      g: this.previewColor[1],
      b: this.previewColor[2],
    }));

    if (previewInstances.length > 0) {
      gl.bindVertexArray(this.instanceVao);
      this.uploadInstances(previewInstances);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, previewInstances.length);
    }

    this.drawJunctions(camera);

    gl.bindVertexArray(null);
  }

  private drawJunctions(camera: Camera): void {
    const junctions = editorStore.getState().junctions;
    if (junctions.size === 0) return;

    const gl = this.gl;
    const skin = useSkinStore.getState().activeSkin;
    this.program.use();
    this.program.setUniformMatrix4fv('u_projection', camera.getProjectionMatrix());
    this.program.setUniform2f('u_resolution', camera.canvasWidth, camera.canvasHeight);
    this.program.setUniform1f('u_dashLength', skin?.wire_style?.dash_length ?? 0.0);
    this.program.setUniform1f('u_gapLength', skin?.wire_style?.gap_length ?? 0.0);
    this.program.setUniform1f('u_glowIntensity', skin?.wire_style?.glow_intensity ?? 0.0);

    const junctionInstances: WireSegmentInstance[] = [];
    const signals = simulationStore.getState().signals;

    for (const [, j] of junctions) {
      if (junctionInstances.length >= MAX_SEGMENTS) break;
      const signal = signals.get(j.netId);
      let r = 0.227;
      let g = 0.227;
      let b = 0.314;
      if (signal === 'High') {
        r = 0.29;
        g = 0.87;
        b = 0.50;
      } else if (signal === 'Low') {
        r = 0.42;
        g = 0.45;
        b = 0.51;
      }

      junctionInstances.push({
        startX: j.x - 0.04,
        startY: j.y,
        endX: j.x + 0.04,
        endY: j.y,
        thickness: 5.0,
        r,
        g,
        b,
      });
    }

    if (junctionInstances.length > 0) {
      gl.bindVertexArray(this.instanceVao);
      this.uploadInstances(junctionInstances);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, junctionInstances.length);
    }
  }

  private uploadInstances(instances: WireSegmentInstance[]): void {
    const gl = this.gl;
    const data = new Float32Array(instances.length * 8);
    for (let i = 0; i < instances.length; i++) {
      const inst = instances[i];
      const base = i * 8;
      data[base] = inst.startX;
      data[base + 1] = inst.startY;
      data[base + 2] = inst.endX;
      data[base + 3] = inst.endY;
      data[base + 4] = inst.thickness;
      data[base + 5] = inst.r;
      data[base + 6] = inst.g;
      data[base + 7] = inst.b;
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
