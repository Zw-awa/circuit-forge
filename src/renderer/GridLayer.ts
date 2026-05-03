import { Camera } from './Camera';
import { ShaderProgram } from './ShaderProgram';
import gridVertSource from './shaders/grid.vert.glsl?raw';
import gridFragSource from './shaders/grid.frag.glsl?raw';

export class GridLayer {
  private gl: WebGL2RenderingContext;
  private program: ShaderProgram;
  private vao: WebGLVertexArrayObject;
  private posBuffer: WebGLBuffer;
  private opacity = 1.0;
  private bgColor: [number, number, number] = [0.118, 0.118, 0.180];
  private minorColor: [number, number, number] = [0.2, 0.2, 0.28];
  private majorColor: [number, number, number] = [0.25, 0.25, 0.35];
  private axisColor: [number, number, number] = [0.35, 0.35, 0.5];

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.program = new ShaderProgram(gl, gridVertSource, gridFragSource);

    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);

    const vertices = new Float32Array([
      -1, -1,  1, -1, -1,  1,
      -1,  1,  1, -1,  1,  1
    ]);

    this.posBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const aPos = this.program.getAttribLocation('a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
  }

  setOpacity(opacity: number): void {
    this.opacity = opacity;
  }

  setColors(
    bgColor: [number, number, number],
    minorColor: [number, number, number],
    majorColor: [number, number, number],
    axisColor: [number, number, number],
  ): void {
    this.bgColor = bgColor;
    this.minorColor = minorColor;
    this.majorColor = majorColor;
    this.axisColor = axisColor;
  }

  draw(camera: Camera): void {
    const gl = this.gl;
    this.program.use();
    this.program.setUniformMatrix4fv('u_invProjection', camera.getInverseProjectionMatrix());
    this.program.setUniform1f('u_zoom', camera.zoom);
    this.program.setUniform1f('u_gridOpacity', this.opacity);
    this.program.setUniform3f('u_bgColor', this.bgColor[0], this.bgColor[1], this.bgColor[2]);
    this.program.setUniform3f('u_minorColor', this.minorColor[0], this.minorColor[1], this.minorColor[2]);
    this.program.setUniform3f('u_majorColor', this.majorColor[0], this.majorColor[1], this.majorColor[2]);
    this.program.setUniform3f('u_axisColor', this.axisColor[0], this.axisColor[1], this.axisColor[2]);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);
  }

  destroy(): void {
    this.gl.deleteBuffer(this.posBuffer);
    this.gl.deleteVertexArray(this.vao);
    this.program.destroy();
  }
}
