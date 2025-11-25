/**
 * First world layer: terrain.
 * Represents only the "floor" / physical map structure
 * (walls, empty spaces, etc.).
 */
export enum TerrainType {
  Empty,
  Wall,
}

/**
 * A terrain tile in world
 * Other layers (vegetation, structures, effects, etc.) will come in other modules.
 */
export interface TerrainTile {
  type: TerrainType;
}

/**
 * Define if a creature can walk on a given tile (terrain).
 * In the future, if we have terrains like "hard" or "dangerous",
 * the logic can grow up here (water, lava, etc.).
 * @param tile A single cell in the world grid containing a terrain
 */
export function isWalkableTerrain(tile: TerrainTile): boolean {
  return tile.type !== TerrainType.Wall;
}

/**
 * Convert a given terrain tile in a character for terminal rendering.
 * @param tile A single cell in the world grid containing a terrain
 */
export function terrainToChar(tile: TerrainTile): string {
  switch (tile?.type) {
    case TerrainType.Empty:
      return ' ';
    case TerrainType.Wall:
      return '#';
    default:
      return '?';
  }
}
