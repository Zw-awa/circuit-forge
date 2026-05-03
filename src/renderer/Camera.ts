export class Camera {
  centerX = 0;
  centerY = 0;
  zoom = 40;
  canvasWidth = 800;
  canvasHeight = 600;

  getProjectionMatrix(): Float32Array {
    const halfW = this.canvasWidth / (2 * this.zoom);
    const halfH = this.canvasHeight / (2 * this.zoom);
    const left = this.centerX - halfW;
    const right = this.centerX + halfW;
    const bottom = this.centerY - halfH;
    const top = this.centerY + halfH;
    return new Float32Array([
      2 / (right - left), 0, 0, 0,
      0, 2 / (top - bottom), 0, 0,
      0, 0, -1, 0,
      -(right + left) / (right - left), -(top + bottom) / (top - bottom), 0, 1
    ]);
  }

  getInverseProjectionMatrix(): Float32Array {
    const halfW = this.canvasWidth / (2 * this.zoom);
    const halfH = this.canvasHeight / (2 * this.zoom);
    const left = this.centerX - halfW;
    const right = this.centerX + halfW;
    const bottom = this.centerY - halfH;
    const top = this.centerY + halfH;
    return new Float32Array([
      (right - left) / 2, 0, 0, 0,
      0, (top - bottom) / 2, 0, 0,
      0, 0, -1, 0,
      (right + left) / 2, (top + bottom) / 2, 0, 1
    ]);
  }

  screenToWorld(sx: number, sy: number): [number, number] {
    const nx = (sx / this.canvasWidth) * 2 - 1;
    const ny = -((sy / this.canvasHeight) * 2 - 1);
    const halfW = this.canvasWidth / (2 * this.zoom);
    const halfH = this.canvasHeight / (2 * this.zoom);
    return [this.centerX + nx * halfW, this.centerY + ny * halfH];
  }

  worldToScreen(wx: number, wy: number): [number, number] {
    const halfW = this.canvasWidth / (2 * this.zoom);
    const halfH = this.canvasHeight / (2 * this.zoom);
    const nx = (wx - this.centerX) / halfW;
    const ny = (wy - this.centerY) / halfH;
    return [(nx + 1) * 0.5 * this.canvasWidth, (1 - (ny + 1) * 0.5) * this.canvasHeight];
  }

  pan(dx: number, dy: number): void {
    this.centerX -= dx;
    this.centerY -= dy;
  }

  zoomAt(screenX: number, screenY: number, factor: number): void {
    const [wx, wy] = this.screenToWorld(screenX, screenY);
    this.zoom = Math.max(10, Math.min(200, this.zoom * factor));
    const [newWx, newWy] = this.screenToWorld(screenX, screenY);
    this.centerX += wx - newWx;
    this.centerY += wy - newWy;
  }
}
