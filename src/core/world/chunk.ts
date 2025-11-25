import {TerrainTile} from '../tile';
import {VegetationTile} from '../layers/vegetation';
import {Entity} from '../ecs/entities';
import {DEFAULT_WORLD_CONFIG} from './config';

export const CHUNK_SIZE = DEFAULT_WORLD_CONFIG.chunkSize;

export interface ChunkCoords {
  cx: number;
  cy: number;
}

export type SimulationLevel = 'full' | 'macro' | 'summary';

/**
 * A `chunk` represents a fixed world region.
 * In this initial phase, will be only a 'false' container
 * that map to an existing global matrix
 */
export interface Chunk {
  id: string; // "cx,cy"
  cx: number;
  cy: number;

  // Top left world coordinates
  originX: number;
  originY: number;

  terrain: TerrainTile[][];
  vegetation: VegetationTile[][];

  entities: Set<Entity>;

  simulationLevel: SimulationLevel;
  lastUpdatedTick: number;
}

/**
 * Helper to generate unique ID
 */
export function chunkId(cx: number, cy: number): string {
  return `${cx},${cy}`;
}
