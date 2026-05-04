export class SpatialHash {
  private cells = new Map<string, number[]>();
  readonly cellSize = 4.0;

  insert(id: number, x: number, y: number): void {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const key = `${cx},${cy}`;
    if (!this.cells.has(key)) this.cells.set(key, []);
    this.cells.get(key)!.push(id);
  }

  remove(id: number, x: number, y: number): void {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const key = `${cx},${cy}`;
    const arr = this.cells.get(key);
    if (arr) {
      const idx = arr.indexOf(id);
      if (idx >= 0) arr.splice(idx, 1);
    }
  }

  query(worldX: number, worldY: number, radius: number): number[] {
    const minCx = Math.floor((worldX - radius) / this.cellSize);
    const maxCx = Math.floor((worldX + radius) / this.cellSize);
    const minCy = Math.floor((worldY - radius) / this.cellSize);
    const maxCy = Math.floor((worldY + radius) / this.cellSize);
    const result: number[] = [];
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const arr = this.cells.get(`${cx},${cy}`);
        if (arr) result.push(...arr);
      }
    }
    return result;
  }

  queryPoint(x: number, y: number): number[] {
    const key = `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
    return this.cells.get(key) ?? [];
  }

  queryRect(minX: number, minY: number, maxX: number, maxY: number): number[] {
    const minCx = Math.floor(minX / this.cellSize);
    const minCy = Math.floor(minY / this.cellSize);
    const maxCx = Math.floor(maxX / this.cellSize);
    const maxCy = Math.floor(maxY / this.cellSize);
    const result: number[] = [];
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const arr = this.cells.get(`${cx},${cy}`);
        if (arr) result.push(...arr);
      }
    }
    return result;
  }

  rebuild(components: Map<number, { x: number; y: number }>): void {
    this.cells.clear();
    for (const [id, comp] of components) {
      this.insert(id, comp.x, comp.y);
    }
  }

  clear(): void {
    this.cells.clear();
  }
}
