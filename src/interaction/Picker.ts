import { editorStore } from '../stores/editorStore';
import { resolveWireEndpointPosition } from '../utils/wireEndpointResolver';

interface WireSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function pointToSegmentDistance(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
}

function computeLRouting(
  ax: number, ay: number, bx: number, by: number, sourceIsRight: boolean,
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

export class Picker {
  hitTestComponent(worldX: number, worldY: number): number | null {
    const state = editorStore.getState();
    const components = state.components;
    for (const comp of components.values()) {
      const hw = 1.0;
      const hh = 1.0;
      if (
        worldX >= comp.x - hw &&
        worldX <= comp.x + hw &&
        worldY >= comp.y - hh &&
        worldY <= comp.y + hh
      ) {
        return comp.id;
      }
    }
    return null;
  }

  hitTestPin(worldX: number, worldY: number, radius = 0.3): number | null {
    const state = editorStore.getState();
    const pins = state.pins;
    let bestId: number | null = null;
    let bestDist = Infinity;

    for (const pin of pins.values()) {
      const dx = worldX - pin.worldX;
      const dy = worldY - pin.worldY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < radius && dist < bestDist) {
        bestDist = dist;
        bestId = pin.id;
      }
    }

    return bestId;
  }

  hitTestRect(minX: number, minY: number, maxX: number, maxY: number): number[] {
    const state = editorStore.getState();
    const components = state.components;
    const result: number[] = [];

    for (const comp of components.values()) {
      const hw = 1.0;
      const hh = 1.0;
      if (
        comp.x + hw >= minX &&
        comp.x - hw <= maxX &&
        comp.y + hh >= minY &&
        comp.y - hh <= maxY
      ) {
        result.push(comp.id);
      }
    }

    return result;
  }

  hitTestWire(worldX: number, worldY: number, tolerance = 0.5): number | null {
    const state = editorStore.getState();
    let bestWireId: number | null = null;
    let bestDist = Infinity;

    for (const wire of state.wires.values()) {
      const posA = resolveWireEndpointPosition(wire.start, state.pins, state.junctions);
      const posB = resolveWireEndpointPosition(wire.end, state.pins, state.junctions);
      if (!posA || !posB) continue;

      const segments = computeLRouting(
        posA.x, posA.y,
        posB.x, posB.y,
        posA.isOutput,
      );
      for (const seg of segments) {
        const dist = pointToSegmentDistance(
          worldX, worldY,
          seg.x1, seg.y1,
          seg.x2, seg.y2,
        );
        if (dist < tolerance && dist < bestDist) {
          bestDist = dist;
          bestWireId = wire.id;
        }
      }
    }

    return bestWireId;
  }

  hitTestJunction(worldX: number, worldY: number, tolerance = 0.5): number | null {
    const state = editorStore.getState();
    let bestId: number | null = null;
    let bestDist = Infinity;

    for (const [id, j] of state.junctions) {
      const dx = worldX - j.x;
      const dy = worldY - j.y;
      const dist = dx * dx + dy * dy;
      if (dist < tolerance * tolerance && dist < bestDist) {
        bestDist = dist;
        bestId = id;
      }
    }

    return bestId;
  }

  getWireAt(worldX: number, worldY: number, tolerance = 0.5): {
    wireId: number;
    snapX: number;
    snapY: number;
  } | null {
    const state = editorStore.getState();
    let bestWireId: number | null = null;
    let bestDist = Infinity;
    let bestSnapX = worldX;
    let bestSnapY = worldY;

    for (const wire of state.wires.values()) {
      const posA = resolveWireEndpointPosition(wire.start, state.pins, state.junctions);
      const posB = resolveWireEndpointPosition(wire.end, state.pins, state.junctions);
      if (!posA || !posB) continue;

      const segments = computeLRouting(
        posA.x, posA.y,
        posB.x, posB.y,
        posA.isOutput,
      );
      for (const seg of segments) {
        const dist = pointToSegmentDistance(
          worldX, worldY,
          seg.x1, seg.y1,
          seg.x2, seg.y2,
        );
        if (dist < tolerance && dist < bestDist) {
          bestDist = dist;
          bestWireId = wire.id;
          // Snap to nearest point on segment
          const dx = seg.x2 - seg.x1;
          const dy = seg.y2 - seg.y1;
          const lenSq = dx * dx + dy * dy;
          if (lenSq === 0) {
            bestSnapX = seg.x1;
            bestSnapY = seg.y1;
          } else {
            let t = ((worldX - seg.x1) * dx + (worldY - seg.y1) * dy) / lenSq;
            t = Math.max(0, Math.min(1, t));
            bestSnapX = seg.x1 + t * dx;
            bestSnapY = seg.y1 + t * dy;
          }
        }
      }
    }

    if (bestWireId === null) return null;
    return { wireId: bestWireId, snapX: bestSnapX, snapY: bestSnapY };
  }
}
