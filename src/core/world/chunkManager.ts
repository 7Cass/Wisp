import {Chunk, CHUNK_SIZE, ChunkCoords, chunkId} from './chunk';
import {WorldGrid} from './world';
import {Viewport} from './viewport';
import {TerrainTile, TerrainType} from '../tile';
import {VegetationTile} from '../layers/vegetation';
import {Entity} from '../ecs/entities';
import {ECSState} from '../ecs/state';
import {WorldGenerator} from './worldGenerator';

export class ChunkManager {
  private chunks: Map<string, Chunk> = new Map();
  private entityToChunk: Map<Entity, string> = new Map();

  constructor(
    private world: WorldGrid,
    private generator: WorldGenerator,
  ) {}

  /**
   * Convert world coordinates to chunk coordinates
   */
  worldToChunk(x: number, y: number): ChunkCoords {
    const cx = Math.floor(x / CHUNK_SIZE);
    const cy = Math.floor(y / CHUNK_SIZE);

    return {
      cx,
      cy
    }
  }

  /**
   * Convert world coordinates to local coordinates
   * @param x
   * @param y
   */
  worldToLocal(x: number, y: number) {
    const { cx, cy } = this.worldToChunk(x, y);
    const originX = cx * CHUNK_SIZE;
    const originY = cy * CHUNK_SIZE;
    const localX = x - originX;
    const localY = y - originY;
    return {
      cx,
      cy,
      localX,
      localY,
      originX,
      originY
    };
  }

  /**
   * Create a chunk using the WorldGenerator (seed + cx/cy).
   * @param cx Chunk X Coordinate
   * @param cy Chunk Y Coordinate
   * @private
   */
  private createEmptyChunkFromGenerator(cx: number, cy: number): Chunk {
    const originX = cx * CHUNK_SIZE;
    const originY = cy * CHUNK_SIZE;

    const generated = this.generator.generateChunk(cx, cy);
    const terrain: TerrainTile[][] = generated.terrain;
    const vegetation: VegetationTile[][] = generated.vegetation;

    return {
      id: chunkId(cx, cy),
      cx,
      cy,
      originX,
      originY,
      terrain,
      vegetation,
      entities: new Set<Entity>(),
      simulationLevel: 'summary',
      lastUpdatedTick: 0,
    };
  }

  /**
   * Ensure that a chunk exist in world and returns it.
   */
  getChunk(cx: number, cy: number): Chunk {
    const id = chunkId(cx, cy);
    let chunk = this.chunks.get(id);

    if (!chunk) {
      chunk = this.createEmptyChunkFromGenerator(cx, cy);
      this.chunks.set(id, chunk);
    }

    return chunk;
  }

  /**
   * Discovers which chunk contains the given tile (x,y).
   */
  getChunkForTile(x: number, y: number): Chunk {
    const { cx, cy } = this.worldToChunk(x, y);
    return this.getChunk(cx, cy);
  }

  getTerrainAt(x: number, y: number): TerrainTile | null {
    if (x < 0 || x >= this.world.width || y < 0 || y >= this.world.height) {
      return null;
    }
    const { cx, cy, localX, localY } = this.worldToLocal(x, y);
    const chunk = this.getChunk(cx, cy);
    return chunk.terrain[localY][localX];
  }

  getVegetationAt(x: number, y: number): VegetationTile | null {
    if (x < 0 || x >= this.world.width || y < 0 || y >= this.world.height) {
      return null;
    }
    const { cx, cy, localX, localY } = this.worldToLocal(x, y);
    const chunk = this.getChunk(cx, cy);
    return chunk.vegetation[localY][localX];
  }

  setTerrainAt(x: number, y: number, tile: TerrainTile): void {
    if (x < 0 || x >= this.world.width || y < 0 || y >= this.world.height) {
      return null;
    }
    const { cx, cy, localX, localY } = this.worldToLocal(x, y);
    const chunk = this.getChunk(cx, cy);
    chunk.terrain[localY][localX] = tile;
  }

  setVegetationAt(x: number, y: number, tile: VegetationTile): void {
    if (x < 0 || x >= this.world.width || y < 0 || y >= this.world.height) {
      return null;
    }
    const { cx, cy, localX, localY } = this.worldToLocal(x, y);
    const chunk = this.getChunk(cx, cy);
    chunk.vegetation[localY][localX] = tile;
  }

  /**
   * Determinate which chunks are visible to the viewport
   */
  getVisibleChunks(viewport: Viewport): Chunk[] {
    const chunks: Chunk[] = [];

    const startCX = Math.floor(viewport.x / CHUNK_SIZE);
    const endCX = Math.floor((viewport.x + viewport.width - 1) / CHUNK_SIZE);

    const startCY = Math.floor(viewport.y / CHUNK_SIZE);
    const endCY = Math.floor((viewport.y + viewport.height - 1) / CHUNK_SIZE);

    for (let cy = startCY; cy <= endCY; cy++) {
      for (let cx = startCX; cx <= endCX; cx++) {
        chunks.push(this.getChunk(cx, cy));
      }
    }

    return chunks;
  }

  /**
   * Add entity at given coordinates
   * @param entity
   * @param x
   * @param y
   */
  addEntity(entity: Entity, x: number, y: number): void {
    if (
      x < 0 || x >= this.world.width ||
      y < 0 || y >= this.world.height
    ) {
      return;
    }

    const { cx, cy } = this.worldToChunk(x, y);
    const chunk = this.getChunk(cx, cy);

    chunk.entities.add(entity);
    this.entityToChunk.set(entity, chunk.id);
  }

  /**
   * Move entity between coordinates
   */
  moveEntity(entity: Entity, oldX: number, oldY: number, newX: number, newY: number): void {
    const oldChunkCoods = this.worldToChunk(oldX, oldY);
    const newChunkCoords = this.worldToChunk(newX, newY);

    if (oldChunkCoods.cx === newChunkCoords.cx && oldChunkCoods.cy === newChunkCoords.cy) {
      return;
    }

    const oldChunkId = chunkId(oldChunkCoods.cx, oldChunkCoods.cy);
    const oldChunk = this.chunks.get(oldChunkId);
    if (oldChunk) {
      oldChunk.entities.delete(entity);
    }

    const newChunk = this.getChunk(newChunkCoords.cx, newChunkCoords.cy);
    newChunk.entities.add(entity);
    this.entityToChunk.set(entity, newChunk.id);
  }

  /**
   * Remove entity
   */
  removeEntity(entity: Entity): void {
    const chunkIdForEntity = this.entityToChunk.get(entity);
    if (!chunkIdForEntity) return;

    const chunk = this.chunks.get(chunkIdForEntity);
    if (chunk) {
      chunk.entities.delete(entity);
    }

    this.entityToChunk.delete(entity);
  }

  /**
   * Get entities from ECS at given coordinates
   * @param ecs
   * @param x
   * @param y
   */
  getEntitiesAt(ecs: ECSState, x: number, y: number): Entity[] {
    const result: Entity[] = [];

    if (
      x < 0 || x >= this.world.width ||
      y < 0 || y >= this.world.height
    ) {
      return result;
    }

    const { cx, cy } = this.worldToChunk(x, y);
    const chunk = this.getChunk(cx, cy);

    for (const entity of chunk.entities) {
      const position = ecs.positions.get(entity);
      if (position && position.x === x && position.y === y) {
        result.push(entity);
      }
    }

    return result;
  }

  /**
   * Define the level of simulation based on viewport.
   * Viewport chunk: FULL
   * Adjacent chunks: MACRO
   * Other chunks: SUMMARY
   */
  updateSimulationLevels(viewport: Viewport): void {
    const active = new Set<string>();

    const visible = this.getVisibleChunks(viewport);

    // Active chunk = the chunk in the center of the viewport
    const centerX = viewport.x + Math.floor(viewport.width / 2);
    const centerY = viewport.y + Math.floor(viewport.height / 2);
    const activeChunk = this.getChunkForTile(centerX, centerY);

    active.add(activeChunk.id);
    activeChunk.simulationLevel = 'full';

    // Neighbor chunks of the viewport -> macro
    for (const chunk of visible) {
      if (chunk.id !== activeChunk.id) {
        chunk.simulationLevel = 'macro';
        active.add(chunk.id);
      }
    }

    // All other chunks -> summary
    for (const chunk of this.chunks.values()) {
      if (!active.has(chunk.id)) {
        chunk.simulationLevel = 'summary';
      }
    }
  }
}
