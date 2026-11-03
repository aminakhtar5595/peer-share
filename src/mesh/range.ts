import type { MeshPeer } from './types';

/** Radio range in the simulated 0–100 coordinate field */
export const RADIO_RANGE = 38;

export function distance(a: Pick<MeshPeer, 'x' | 'y'>, b: Pick<MeshPeer, 'x' | 'y'>): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function inRange(a: Pick<MeshPeer, 'x' | 'y'>, b: Pick<MeshPeer, 'x' | 'y'>, range = RADIO_RANGE): boolean {
  return distance(a, b) <= range;
}
