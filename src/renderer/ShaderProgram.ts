export class ShaderProgram {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;

  constructor(gl: WebGL2RenderingContext, vertSource: string, fragSource: string) {
    this.gl = gl;
    const vertShader = this.compileShader(gl.VERTEX_SHADER, vertSource);
    const fragShader = this.compileShader(gl.FRAGMENT_SHADER, fragSource);
    this.program = this.linkProgram(vertShader, fragShader);
  }

  private compileShader(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type);
    if (!shader) {
      throw new Error(`Failed to create shader of type ${type}`);
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader) || 'Unknown error';
      gl.deleteShader(shader);
      throw new Error(`Shader compile error: ${info}`);
    }
    return shader;
  }

  private linkProgram(vertShader: WebGLShader, fragShader: WebGLShader): WebGLProgram {
    const gl = this.gl;
    const program = gl.createProgram();
    if (!program) {
      throw new Error('Failed to create shader program');
    }
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program) || 'Unknown error';
      gl.deleteProgram(program);
      gl.deleteShader(vertShader);
      gl.deleteShader(fragShader);
      throw new Error(`Program link error: ${info}`);
    }
    gl.deleteShader(vertShader);
    gl.deleteShader(fragShader);
    return program;
  }

  use(): void {
    this.gl.useProgram(this.program);
  }

  getAttribLocation(name: string): number {
    return this.gl.getAttribLocation(this.program, name);
  }

  getProgram(): WebGLProgram {
    return this.program;
  }

  private getUniformLocation(name: string): WebGLUniformLocation | null {
    return this.gl.getUniformLocation(this.program, name);
  }

  setUniform1i(name: string, value: number): void {
    const loc = this.getUniformLocation(name);
    if (loc !== null) {
      this.gl.uniform1i(loc, value);
    }
  }

  setUniformMatrix4fv(name: string, value: Float32Array): void {
    const loc = this.getUniformLocation(name);
    if (loc !== null) {
      this.gl.uniformMatrix4fv(loc, false, value);
    }
  }

  setUniform1f(name: string, value: number): void {
    const loc = this.getUniformLocation(name);
    if (loc !== null) {
      this.gl.uniform1f(loc, value);
    }
  }

  setUniform2f(name: string, x: number, y: number): void {
    const loc = this.getUniformLocation(name);
    if (loc !== null) {
      this.gl.uniform2f(loc, x, y);
    }
  }

  setUniform4f(name: string, x: number, y: number, z: number, w: number): void {
    const loc = this.getUniformLocation(name);
    if (loc !== null) {
      this.gl.uniform4f(loc, x, y, z, w);
    }
  }

  setUniform3f(name: string, x: number, y: number, z: number): void {
    const loc = this.getUniformLocation(name);
    if (loc !== null) {
      this.gl.uniform3f(loc, x, y, z);
    }
  }

  destroy(): void {
    this.gl.deleteProgram(this.program);
  }
}
