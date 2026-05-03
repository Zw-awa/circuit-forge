export function generateTextureAtlas(theme: 'dark' | 'light' = 'dark'): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const isDark = theme === 'dark';
  const bgFill = isDark ? '#1e1e2e' : '#f0f0f5';
  const bodyFill = isDark ? '#353550' : '#d0d0e0';
  const bodyStroke = isDark ? '#7c6ff0' : '#6c5ce7';
  const textFill = isDark ? '#e0e0e0' : '#1a1a2e';
  const altFill = isDark ? '#3a3a5c' : '#c8c8e0';
  const signalGreen = isDark ? '#4ade80' : '#22c55e';

  ctx.fillStyle = bgFill;
  ctx.fillRect(0, 0, 1024, 64);

  const kinds = [
    'And', 'Or', 'Not', 'Nand', 'Xor', 'Switch', 'Led',
    'Button', 'Clock', 'Random', 'Constant', 'SevenSegment',
    'Oscilloscope', 'DelayLine', 'Splitter', 'Merger',
  ] as const;

  const labels: Record<string, string> = {
    And: '&', Or: '\u22651', Not: '1', Nand: '&\u25CB', Xor: '=1', Switch: 'SW', Led: '\u2600',
    Button: 'BTN', Clock: 'CLK', Random: 'RNG', Constant: 'CST',
    SevenSegment: '7SEG', Oscilloscope: '', DelayLine: 'DLY', Splitter: 'SPL', Merger: 'MRG',
  };

  kinds.forEach((kind, i) => {
    const x = i * 64;

      // Draw component body (rounded rect)
      ctx.fillStyle = bodyFill;
      ctx.strokeStyle = bodyStroke;
    ctx.lineWidth = 2;
    const bx = x + 8, by = 8, bw = 48, bh = 48, r = 6;
    ctx.beginPath();
    ctx.moveTo(bx + r, by);
    ctx.lineTo(bx + bw - r, by);
    ctx.arcTo(bx + bw, by, bx + bw, by + r, r);
    ctx.lineTo(bx + bw, by + bh - r);
    ctx.arcTo(bx + bw, by + bh, bx + bw - r, by + bh, r);
    ctx.lineTo(bx + r, by + bh);
    ctx.arcTo(bx, by + bh, bx, by + bh - r, r);
    ctx.lineTo(bx, by + r);
    ctx.arcTo(bx, by, bx + r, by, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

      // Draw label
      ctx.fillStyle = textFill;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (kind === 'Oscilloscope') {
      // Monitor shape + waveform line
      ctx.fillRect(x + 12, 14, 40, 24);
      ctx.strokeStyle = signalGreen;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 16, 30);
      ctx.lineTo(x + 20, 22);
      ctx.lineTo(x + 26, 35);
      ctx.lineTo(x + 34, 18);
      ctx.lineTo(x + 42, 28);
      ctx.lineTo(x + 48, 24);
      ctx.stroke();
      ctx.strokeStyle = bodyStroke;
      ctx.lineWidth = 2;
    } else if (kind === 'SevenSegment') {
      // 7-segment outline
      ctx.strokeStyle = signalGreen;
      ctx.lineWidth = 2;
      const sx = x + 18, sy = 18;
      ctx.strokeRect(sx + 4, sy, 20, 3);
      ctx.strokeRect(sx + 24, sy + 4, 3, 8);
      ctx.strokeRect(sx + 24, sy + 14, 3, 8);
      ctx.strokeRect(sx + 4, sy + 24, 20, 3);
      ctx.strokeRect(sx, sy + 14, 3, 8);
      ctx.strokeRect(sx, sy + 4, 3, 8);
      ctx.strokeRect(sx + 4, sy + 12, 20, 3);
      ctx.strokeStyle = bodyStroke;
    } else if (kind === 'Splitter') {
      // Trapezoid going wide (left narrow, right wide)
      ctx.fillStyle = altFill;
      ctx.beginPath();
      ctx.moveTo(x + 8, 28);
      ctx.lineTo(x + 20, 16);
      ctx.lineTo(x + 56, 16);
      ctx.lineTo(x + 56, 48);
      ctx.lineTo(x + 20, 48);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = textFill;
      ctx.fillText(labels[kind], x + 38, 36);
    } else if (kind === 'Merger') {
      // Trapezoid going narrow (left wide, right narrow)
      ctx.fillStyle = altFill;
      ctx.beginPath();
      ctx.moveTo(x + 8, 16);
      ctx.lineTo(x + 44, 16);
      ctx.lineTo(x + 56, 28);
      ctx.lineTo(x + 56, 36);
      ctx.lineTo(x + 44, 48);
      ctx.lineTo(x + 8, 48);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = textFill;
      ctx.fillText(labels[kind], x + 26, 36);
    } else if (kind === 'Clock') {
      // Small wave icon
      ctx.fillStyle = signalGreen;
      ctx.beginPath();
      ctx.moveTo(x + 42, 22);
      ctx.lineTo(x + 44, 18);
      ctx.lineTo(x + 47, 26);
      ctx.lineTo(x + 50, 18);
      ctx.lineTo(x + 53, 26);
      ctx.lineTo(x + 55, 22);
      ctx.stroke();
      ctx.strokeStyle = bodyStroke;
      ctx.lineWidth = 2;
      ctx.fillText(labels[kind], x + 32, 36);
    } else if (kind === 'DelayLine') {
      // Arrow
      ctx.fillStyle = signalGreen;
      ctx.beginPath();
      ctx.moveTo(x + 42, 28);
      ctx.lineTo(x + 52, 28);
      ctx.lineTo(x + 52, 26);
      ctx.lineTo(x + 56, 30);
      ctx.lineTo(x + 52, 34);
      ctx.lineTo(x + 52, 32);
      ctx.lineTo(x + 42, 32);
      ctx.closePath();
      ctx.fill();
      ctx.fillText(labels[kind], x + 24, 36);
    } else {
      ctx.fillText(labels[kind], x + 32, 36);
    }

    // Draw small pin dots on edges
    ctx.fillStyle = signalGreen;

    if (kind !== 'Switch' && kind !== 'Button' && kind !== 'Clock' && kind !== 'Constant' && kind !== 'Random') {
      ctx.fillRect(x + 4, 28, 6, 6);
    }
    if (kind === 'Splitter' || kind === 'Merger') {
      // Extra input/output indicators
      if (kind === 'Splitter') {
        ctx.fillRect(x + 54, 28, 6, 6);
        ctx.fillRect(x + 54, 18, 6, 6);
        ctx.fillRect(x + 54, 38, 6, 6);
      } else {
        ctx.fillRect(x + 4, 28, 6, 6);
        ctx.fillRect(x + 4, 18, 6, 6);
        ctx.fillRect(x + 4, 38, 6, 6);
      }
    } else if (['And', 'Or', 'Nand', 'Xor', 'SevenSegment', 'Oscilloscope'].includes(kind)) {
      ctx.fillRect(x + 4, 38, 6, 6);
    }
    if (kind !== 'Led' && kind !== 'Oscilloscope' && kind !== 'SevenSegment') {
      ctx.fillRect(x + 54, 28, 6, 6);
    }
  });

  return canvas;
}

export function generateSubCircuitTexture(name: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const label = name.slice(0, 3);

  ctx.fillStyle = '#2a3a5e';
  ctx.fillRect(0, 0, 64, 64);

  ctx.strokeStyle = '#7c6ff0';
  ctx.lineWidth = 2;
  const bx = 4, by = 4, bw = 56, bh = 56, r = 8;
  ctx.beginPath();
  ctx.moveTo(bx + r, by);
  ctx.lineTo(bx + bw - r, by);
  ctx.arcTo(bx + bw, by, bx + bw, by + r, r);
  ctx.lineTo(bx + bw, by + bh - r);
  ctx.arcTo(bx + bw, by + bh, bx + bw - r, by + bh, r);
  ctx.lineTo(bx + r, by + bh);
  ctx.arcTo(bx, by + bh, bx, by + bh - r, r);
  ctx.lineTo(bx, by + r);
  ctx.arcTo(bx, by, bx + r, by, r);
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = '#e0e0ff';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 32, 32);

  return canvas;
}

export class TextureAtlas {
  private gl: WebGL2RenderingContext;
  texture: WebGLTexture;
  private uvMap: Record<string, { u0: number; v0: number; u1: number; v1: number }>;
  private subTextures: Map<number, HTMLCanvasElement> = new Map();
  private nextSubSlot = 16;

  constructor(gl: WebGL2RenderingContext, theme: 'dark' | 'light' = 'dark') {
    this.gl = gl;
    this.texture = this.createTexture(theme);
    this.uvMap = this.buildUVMap();
  }

  private createTexture(theme: 'dark' | 'light'): WebGLTexture {
    const gl = this.gl;
    const canvas = generateTextureAtlas(theme);

    for (const [slot, subCanvas] of this.subTextures) {
      const subCtx = canvas.getContext('2d')!;
      subCtx.drawImage(subCanvas, slot * 64, 0);
    }

    const texture = gl.createTexture();
    if (!texture) {
      throw new Error('Failed to create texture atlas');
    }
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  }

  regenerate(theme: 'dark' | 'light'): void {
    this.gl.deleteTexture(this.texture);
    this.texture = this.createTexture(theme);
  }

  registerSubCircuit(name: string): string {
    const slotKey = `subcircuit_${name}`;
    if (this.uvMap[slotKey]) return slotKey;

    const canvas = generateSubCircuitTexture(name);
    const slot = this.nextSubSlot++;

    const atlasWidth = 1024;
    const atlasHeight = 64;
    const u0 = (slot * 64) / atlasWidth;
    const u1 = u0 + 64 / atlasWidth;
    const v0 = 0;
    const v1 = 64 / atlasHeight;

    this.uvMap[slotKey] = { u0, v0, u1, v1 };
    this.subTextures.set(slot, canvas);

    const atlasCanvas = document.createElement('canvas');
    atlasCanvas.width = atlasWidth;
    atlasCanvas.height = atlasHeight;
    const ctx = atlasCanvas.getContext('2d')!;
    for (const [s, sc] of this.subTextures) {
      ctx.drawImage(sc, s * 64, 0);
    }

    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, slot * 64, 0, 64, 64, gl.RGBA, gl.UNSIGNED_BYTE, canvas);

    return slotKey;
  }

  private buildUVMap(): Record<string, { u0: number; v0: number; u1: number; v1: number }> {
    const atlasWidth = 1024;
    const atlasHeight = 64;
    const kindW = 64 / atlasWidth;
    const kindH = 64 / atlasHeight;
    const kinds = [
      'And', 'Or', 'Not', 'Nand', 'Xor', 'Switch', 'Led',
      'Button', 'Clock', 'Random', 'Constant', 'SevenSegment',
      'Oscilloscope', 'DelayLine', 'Splitter', 'Merger',
    ] as const;

    const uvMap: Record<string, { u0: number; v0: number; u1: number; v1: number }> = {};
    kinds.forEach((kind, i) => {
      const u0 = (i * 64) / atlasWidth;
      const u1 = u0 + kindW;
      const v0 = 0;
      const v1 = kindH;
      uvMap[kind] = { u0, v0, u1, v1 };
    });
    return uvMap;
  }

  getUV(kind: string): { u0: number; v0: number; u1: number; v1: number } {
    const uv = this.uvMap[kind];
    if (!uv) {
      return { u0: 0, v0: 0, u1: 1, v1: 1 };
    }
    return uv;
  }

  bind(gl: WebGL2RenderingContext, unit: number): void {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
  }

  destroy(): void {
    this.gl.deleteTexture(this.texture);
  }
}
