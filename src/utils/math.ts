export interface Vec2 {
  x: number;
  y: number;
}

export function gridSnap(value: number): number {
  return Math.round(value);
}

export function gridSnapVec2(v: Vec2): Vec2 {
  return { x: Math.round(v.x), y: Math.round(v.y) };
}

export interface AABB {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function aabbFromBounds(x1: number, y1: number, x2: number, y2: number): AABB {
  return {
    minX: Math.min(x1, x2),
    minY: Math.min(y1, y2),
    maxX: Math.max(x1, x2),
    maxY: Math.max(y1, y2),
  };
}

export function aabbContains(aabb: AABB, x: number, y: number): boolean {
  return x >= aabb.minX && x <= aabb.maxX && y >= aabb.minY && y <= aabb.maxY;
}

export function aabbIntersects(a: AABB, b: AABB): boolean {
  return !(a.maxX < b.minX || a.minX > b.maxX || a.maxY < b.minY || a.minY > b.maxY);
}
