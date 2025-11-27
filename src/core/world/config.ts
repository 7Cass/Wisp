export interface WorldConfig {
  // Chunk size in tiles
  chunkSize: number;

  // World size in tiles
  worldWidth: number;
  worldHeight: number;
}

/**
 * Default world config.
 *
 * In the future:
 *  - this can come from a JSON file
 *  - can be modified in debug time
 *  - can change by `seed` or preset (small / medium / large)
 */
export const DEFAULT_WORLD_CONFIG: WorldConfig = {
  chunkSize: 64,
  worldWidth: 64 * 32,
  worldHeight: 64 * 32,
};
