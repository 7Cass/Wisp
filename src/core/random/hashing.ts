/**
 * Deterministic hash from string -> 32-bit unsigned integer.
 * @param value
 */
export function hashStringToInt(value: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Deterministic hash from (seed, cx, cy) -> 32-bit integer.
 * @param seed
 * @param cx
 * @param cy
 */
export function makeChunkSeed(seed: string, cx: number, cy: number): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= cx;
  h = Math.imul(h, 16777619);
  h ^= cy;
  h = Math.imul(h, 16777619);
  return h >>> 0;
}
