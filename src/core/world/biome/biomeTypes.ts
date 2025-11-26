import {TerrainType} from '../../tile';
import { VegetationType } from '../layers/vegetation';

/**
 * Biome identifier on map.
 */
export type BiomeId =
  | 'tundra'
  | 'taiga'
  | 'temperate_forest'
  | 'grassland'
  | 'savanna'
  | 'desert'
  | 'swamp'
  | 'tropical_forest'
  | 'mountain'
  | 'shallow_water'
  | 'deep_water';

/**
 * Basic vegetation rules in each biome.
 * Each property is a relative weight - the generator normalizes it internally.
 */
export interface VegetationProfile {
  [type: VegetationType | 'none']: number;
}

/**
 * Represents the biome definition:
 *  - conceptual ranges used by BiomeMap
 *  - visual and physical behaviors
 *  - preferred vegetation and terrain types
 */
export interface BiomeDefinition {
  id: BiomeId;
  name: string;

  // Conceptual intervals that the BiomeMap uses to classify tiles.
  // The BiomeMap NEVER read the terrain - only reads altitude/moisture/temperature
  minTemp: number;
  maxTemp: number;
  minMoisture: number;
  maxMoisture: number;
  minAltitude: number;
  maxAltitude: number;

  // Flags
  isWater?: boolean;
  isMountain?: boolean;

  // Base terrain dominance
  terrain: TerrainType;

  // Simple vegetation profile (weights)
  vegetation: VegetationProfile;
}

/**
 * Map of all available biomes in the world.
 * The ProceduralBiomeMap will use this data to select the biome for each tile.
 */
export const BIOMES: BiomeDefinition[] = [
  {
    id: "tundra",
    name: "Tundra",
    minTemp: 0.0, maxTemp: 0.25,
    minMoisture: 0.2, maxMoisture: 0.8,
    minAltitude: 0.0, maxAltitude: 0.6,
    terrain: TerrainType.Snow,
    vegetation: {
      grass: 0.1,
      tall_grass: 0.05,
      bush: 0.05
    }
  },
  {
    id: "taiga",
    name: "Taiga (Conifer Forest)",
    minTemp: 0.15, maxTemp: 0.45,
    minMoisture: 0.3, maxMoisture: 0.9,
    minAltitude: 0.0, maxAltitude: 0.7,
    terrain: TerrainType.Grass,
    vegetation: {
      pine_tree: 0.5,
      bush: 0.2,
      tall_grass: 0.2,
      grass: 0.1
    }
  },
  {
    id: "temperate_forest",
    name: "Temperate Forest",
    minTemp: 0.3, maxTemp: 0.7,
    minMoisture: 0.4, maxMoisture: 1.0,
    minAltitude: 0.0, maxAltitude: 0.7,
    terrain: TerrainType.Grass,
    vegetation: {
      tree: 0.4,
      bush: 0.2,
      tall_grass: 0.2,
      grass: 0.2
    }
  },
  {
    id: "grassland",
    name: "Grassland / Plains",
    minTemp: 0.3, maxTemp: 0.8,
    minMoisture: 0.2, maxMoisture: 0.6,
    minAltitude: 0.0, maxAltitude: 0.6,
    terrain: TerrainType.Grass,
    vegetation: {
      grass: 0.6,
      tall_grass: 0.3,
      flower: 0.1
    }
  },
  {
    id: "savanna",
    name: "Savanna",
    minTemp: 0.6, maxTemp: 1.0,
    minMoisture: 0.1, maxMoisture: 0.4,
    minAltitude: 0.0, maxAltitude: 0.6,
    terrain: TerrainType.Dirt,
    vegetation: {
      tall_grass: 0.5,
      bush: 0.3,
      grass: 0.2
    }
  },
  {
    id: "desert",
    name: "Desert",
    minTemp: 0.7, maxTemp: 1.0,
    minMoisture: 0.0, maxMoisture: 0.2,
    minAltitude: 0.0, maxAltitude: 0.8,
    terrain: TerrainType.Sand,
    vegetation: {
      none: 1.0
    }
  },
  {
    id: "swamp",
    name: "Swamp",
    minTemp: 0.4, maxTemp: 0.9,
    minMoisture: 0.6, maxMoisture: 1.0,
    minAltitude: 0.0, maxAltitude: 0.4,
    terrain: TerrainType.Swamp,
    vegetation: {
      reed: 0.6,
      lily: 0.3,
      bush: 0.1
    }
  },
  {
    id: "tropical_forest",
    name: "Tropical Forest / Jungle",
    minTemp: 0.6, maxTemp: 1.0,
    minMoisture: 0.6, maxMoisture: 1.0,
    minAltitude: 0.0, maxAltitude: 0.6,
    terrain: TerrainType.Grass,
    vegetation: {
      tree: 0.4,
      pine_tree: 0.05,
      tall_grass: 0.25,
      bush: 0.2,
      flower: 0.1
    }
  },
  {
    id: "mountain",
    name: "Mountain",
    minTemp: 0.0, maxTemp: 0.6,
    minMoisture: 0.0, maxMoisture: 0.7,
    minAltitude: 0.6, maxAltitude: 1.0,
    isMountain: true,
    terrain: TerrainType.Rock,
    vegetation: {
      grass: 0.1,
      bush: 0.05
    }
  },
  {
    id: "shallow_water",
    name: "Shallow Water",
    minTemp: 0.0, maxTemp: 1.0,
    minMoisture: 0.9, maxMoisture: 1.0,
    minAltitude: 0.0, maxAltitude: 0.15,
    isWater: true,
    terrain: TerrainType.ShallowWater,
    vegetation: {
      lily: 0.4,
      reed: 0.2
    }
  },
  {
    id: "deep_water",
    name: "Deep Water",
    minTemp: 0.0, maxTemp: 1.0,
    minMoisture: 0.9, maxMoisture: 1.0,
    minAltitude: -1.0, maxAltitude: 0.05,
    isWater: true,
    terrain: TerrainType.Water,
    vegetation: {
      none: 1.0
    }
  }
];
