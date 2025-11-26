import {TerrainTile, TerrainType} from '../tile';
import {VegetationTile} from '../layers/vegetation';
import {CHUNK_SIZE} from './chunk';
import {mulberry32} from '../random/prng';
import {makeChunkSeed} from '../random/hashing';

export interface WorldGeneratorConfig {
  seed: string;
  worldWidth: number;
  worldHeight: number;
}

export interface GeneratedChunkData {
  terrain: TerrainTile[][];
  vegetation: VegetationTile[][];
}

export interface WorldGenerator {
  generateChunk(cx: number, cy: number): GeneratedChunkData;
}

/**
 * Generator V1:
 *  - fill the chunk with Wall
 *  - with some chance, carve ONE empty rectangular room
 *  - place some random bushes over walkable terrains
 *
 *  All deterministic by (seed, cx, cy)
 */
export class DungeonWorldGenerator implements WorldGenerator {
  constructor(private readonly config: WorldGeneratorConfig) {}

  generateChunk(cx: number, cy: number): GeneratedChunkData {
    const terrain: TerrainTile[][] = [];
    const vegetation: VegetationTile[][] = [];

    const seed = makeChunkSeed(this.config.seed, cx, cy);
    const rng = mulberry32(seed);

    // Start with Wall / vegetation None
    for (let y = 0; y < CHUNK_SIZE; y++) {
      terrain[y] = [];
      vegetation[y] = [];
      for (let x = 0; x < CHUNK_SIZE; x++) {
        terrain[y][x] = { type: TerrainType.Wall };
        vegetation[y][x] = { type: 'none' };
      }
    }

    // Decide if this chunk will have a carved "room"
    const hasRoom = rng() < 0.7;

    if (hasRoom) {
      const roomWidth = 4 + Math.floor(rng() * (CHUNK_SIZE - 6));
      const roomHeight = 4 + Math.floor(rng() * (CHUNK_SIZE - 6));

      const maxX = CHUNK_SIZE - roomWidth - 1;
      const maxY = CHUNK_SIZE - roomHeight - 1;

      const roomX = 1 + Math.floor(rng() * Math.max(1, maxX));
      const roomY = 1 + Math.floor(rng() * Math.max(1, maxY));

      for (let y = roomY; y < roomY + roomHeight; y++) {
        for (let x = roomX; x < roomX + roomWidth; x++) {
          terrain[y][x] = {type: TerrainType.Empty};
        }
      }
    }

    // Simple vegetation: random bushes in some EMPTY tiles
    for (let y = 0; y < CHUNK_SIZE; y++) {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        if (terrain[y][x].type === TerrainType.Empty && rng() < 0.05) {
          vegetation[y][x] = { type: 'bush' };
        }
      }
    }

    return {
      terrain,
      vegetation
    };
  }
}
