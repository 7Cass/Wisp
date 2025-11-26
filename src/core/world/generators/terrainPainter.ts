import {BiomeDefinition} from '../biome/biomeTypes';
import {TerrainTile, TerrainType} from '../../tile';

/**
 * Context to paint a terrain tile.
 * All values should be normalized in [0,1]
 */
export interface TerrainPainterContext {
  altitude: number;    // 0 = very low / ocean, 1 = top of a mountain
  moisture: number;    // 0 = super dry , 1 = super wet
  temperature: number; // 0 = very cold, 1 = very how
  biome: BiomeDefinition;
}

/**
 * Every TerrainPainter implementer knows, given the tile context,
 * which TerrainTile to return.
 */
export interface TerrainPainter {
  paint(ctx: TerrainPainterContext): TerrainTile;
}

/**
 * Default TerrainPainter implementation.
 *
 * Rules:
 *  - Ensure water in lower altitudes (independent of the biome, as a fallback)
 *  - Ensure shallow water in altitudes closer to sea level
 *  - Convert rocks into snow in higher altitudes
 *  - Apart from this, use biome.terrain as default
 */
export  class DefaultTerrainPainter implements TerrainPainter {
  /**
   * Approximated sea level limit.
   * altitude < seaLevel => water (deep or shallow)
   */
  constructor(
    private readonly seaLevel: number = 0.25
  ) {
  }

  paint(ctx: TerrainPainterContext): TerrainTile {
    const { altitude, biome } = ctx;

    const alt = this.clamp01(altitude);
    let type: TerrainType = biome.terrain;

    // Ensure oceans / coasts by altitude
    // Very low zones: deep water
    if (alt < this.seaLevel * 0.6) {
      type = TerrainType.Water;
    }
    // A little bit above: shallow water / coast
    else if (alt < this.seaLevel) {
      type = TerrainType.ShallowWater;
    } else {
      // Mountains adjustment -> snow
      if (type === TerrainType.Rock && alt > 0.85) {
        type = TerrainType.Snow;
      }
      // Future: adjust other terrains based on altitude
      // Ex.: Dirt -> Rock in higher altitudes, etc.
    }

    return { type };
  }

  private clamp01(value: number): number {
    if (Number.isNaN(value)) return 0;
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
  }
}
