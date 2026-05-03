import type { WireEndpoint, Pin, Junction } from '../types/circuit';

export interface ResolvedEndpoint {
  x: number;
  y: number;
  isOutput: boolean;
}

export function resolveWireEndpointPosition(
  endpoint: WireEndpoint,
  pins: Map<number, Pin>,
  junctions: Map<number, Junction>,
): ResolvedEndpoint | null {
  if (endpoint.type === 'pin') {
    const pin = pins.get(endpoint.id);
    if (!pin) return null;
    return { x: pin.worldX, y: pin.worldY, isOutput: pin.isOutput };
  }
  const junction = junctions.get(endpoint.id);
  if (!junction) return null;
  return { x: junction.x, y: junction.y, isOutput: false };
}
