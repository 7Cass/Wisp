import {TerrainTile, TerrainType} from '../../tile';
import {createVegetationTile, VegetationTile} from '../layers/vegetation';
import {CHUNK_SIZE} from '../chunk';
import {TerrainPainter} from './terrainPainter';
import {VegetationPainter} from './vegetationPainter';
import {BiomeMap} from '../biome/biomeMap';
import {ValueNoiseHeightMap} from './heightMap';
import {ValueNoiseMoistureMap} from './moistureMap';
import {ValueNoiseTemperatureMap} from './temperatureMap';

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
 * New procedural world generator:
 *  - uses scalar fields (height/moisture/temp)
 *  - a biome resolver
 *  - a terrain painter
 *  - a vegetation painter
 *
 * It is fully deterministic as long as those components are deterministic
 * for the same (seed, worldX, worldY).
 */
export class ProceduralWorldGenerator implements WorldGenerator {
  constructor(
    private readonly config: WorldGeneratorConfig,
    private readonly heightMap: ValueNoiseHeightMap,
    private readonly moistureMap: ValueNoiseMoistureMap,
    private readonly temperatureMap: ValueNoiseTemperatureMap,
    private readonly biomeMap: BiomeMap,
    private readonly terrainPainter: TerrainPainter,
    private readonly vegetationPainter: VegetationPainter
  ) {}

  generateChunk(cx: number, cy: number): GeneratedChunkData {
    const terrain: TerrainTile[][] = [];
    const vegetation: VegetationTile[][] = [];

    const worldOriginX = cx * CHUNK_SIZE;
    const worldOriginY = cy * CHUNK_SIZE;

    for (let localY = 0; localY < CHUNK_SIZE; localY++) {
      terrain[localY] = [];
      vegetation[localY] = [];

      const worldY = worldOriginY + localY;

      for (let localX = 0; localX < CHUNK_SIZE; localX++) {
        const worldX = worldOriginX + localX;

        // Out of "real" world bound -> fill with default
        if (
          worldX < 0 ||
          worldX >= this.config.worldWidth ||
          worldY < 0 ||
          worldY >= this.config.worldHeight
        ) {
          terrain[localY][localX] = { type: TerrainType.Wall };
          vegetation[localY][localX] = createVegetationTile('none');
          continue;
        }

        // Scalar fields
        const altitude = this.heightMap.get(worldX, worldY);
        const moisture = this.moistureMap.get(worldX, worldY);
        const temperature = this.temperatureMap.get(worldX, worldY, altitude);

        // Biome
        const biome = this.biomeMap.pickBiome(
          altitude,
          moisture,
          temperature
        );

        // Terrain
        const terrainTile = this.terrainPainter.paint({
          altitude,
          moisture,
          temperature,
          biome,
        });

        // Vegetation
        const vegetationTile = this.vegetationPainter.paint({
          worldX,
          worldY,
          altitude,
          moisture,
          temperature,
          biome,
          terrain: terrainTile,
        });

        terrain[localY][localX] = terrainTile;
        vegetation[localY][localX] = vegetationTile;
      }
    }

    return {
      terrain,
      vegetation,
    };
  }
}
