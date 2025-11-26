/**
 * First world layer: terrain.
 * Represents only the "floor" / physical map structure
 * (walls, empty spaces, etc.).
 */
export enum TerrainType {
  // Legacy (remove after)
  Empty = 'empty',
  Wall = 'wall',

  // Natural terrains
  Grass = 'grass',
  Dirt = 'dirt',
  Sand = 'sand',

  Water = 'water',
  ShallowWater = 'shallow_water',
  Swamp = 'swamp',

  Rock = 'rock',
  Snow = 'snow'
}

/**
 * A terrain tile in world
 */
export interface TerrainTile {
  type: TerrainType;
}

/**
 * Define if a creature can walk on a given tile (terrain).
 * Here we take an initial decision:
 *  - Water/Swamp/Rock ARE NOT walkable.
 *  - Grass/Dirt/Sand/Snow ARE walkable.
 *  - Empty behave like walkable (legacy)
 * @param tile A single cell in the world grid containing a terrain
 */
export function isWalkableTerrain(tile: TerrainTile | null | undefined): boolean {
  if (!tile) return false;

  switch (tile.type) {
    case TerrainType.Water:
    case TerrainType.ShallowWater:
    case TerrainType.Swamp:
    case TerrainType.Wall:
    case TerrainType.Rock:
      return false;

    case TerrainType.Grass:
    case TerrainType.Dirt:
    case TerrainType.Sand:
    case TerrainType.Snow:
    case TerrainType.Empty:
      return true;

    default:
      return false;
  }
}

/**
 * Map terrain to char for terminal adapter. (probably should not be here but whatever)
 * Purely visual; Can enhance later.
 * @param tile A single cell in the world grid containing a terrain
 */
export function terrainToChar(tile: TerrainTile | null | undefined): string {
  if (!tile) return ' ';

  switch (tile.type) {
    case TerrainType.Empty:
      return ' ';
    case TerrainType.Wall:
      return '#';
    case TerrainType.Grass:
      return ',';
    case TerrainType.Dirt:
      return '.';
    case TerrainType.Sand:
      return ':'
    case TerrainType.Water:
      return '~'
    case TerrainType.ShallowWater:
      return '≈'
    case TerrainType.Swamp:
      return '%';
    case TerrainType.Rock:
      return '^';
    case TerrainType.Snow:
      return '*';

    default:
      return '?';
  }
}
