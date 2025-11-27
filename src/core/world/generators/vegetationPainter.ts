import {BiomeDefinition, VegetationProfile} from '../biome/biomeTypes';
import {TerrainTile} from '../../tile';
import {createVegetationTile, VegetationTile, VegetationType} from '../layers/vegetation';
import {mulberry32} from '../../random/prng';
import {hashStringToInt} from '../../random/hashing';

/**
 * Context to paint a tile vegetation.
 * worldX/worldY are global coordinates (not local to chunk).
 * altitude/moisture/temperature must be normalized in [0,1].
 */
export interface VegetationPainterContext {
  worldX: number;
  worldY: number;

  altitude: number;
  moisture: number;
  temperature: number;

  biome: BiomeDefinition;
  terrain: TerrainTile;
}

/**
 * Basic vegetation painter interface
 */
export interface VegetationPainter {
  paint(ctx: VegetationPainterContext): VegetationTile;
}

/**
 * Create a deterministic value-noise 2D using mulberry32.
 * We use this as a base for smooth interpolation (value noise)
 */
function makeValueNoise2D(baseSeed: number) {
  return (x: number, y: number): number => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);

    const cellSeed = (xi * 374761393 + yi * 668265263) ^ baseSeed;
    const rng = mulberry32(cellSeed >>> 0);

    return rng();
  };
}

function smoothStep(t: number): number {
  return t * t * (3 - 2 * t);
}

function interpolatedValueNoise2D(
  baseNoise: (x: number, y: number) => number,
  x: number,
  y: number
): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;

  const sx = smoothStep(x - x0);
  const sy = smoothStep(y - y0);

  const n00 = baseNoise(x0, y0);
  const n10 = baseNoise(x1, y0);
  const n01 = baseNoise(x0, y1);
  const n11 = baseNoise(x1, y1);

  const ix0 = n00 + (n10 - n00) * sx;
  const ix1 = n01 + (n11 - n01) * sx;

  return ix0 + (ix1 - ix0) * sy;
}

/**
 * Vegetation painter configuration.
 *
 *  - seed: global seed (we use a suffix '|vegetation' to differentiate)
 *  - noiseScale: controls the size of vegetation "blobs" (higher = smoother)
 *  - densityThreshold: base probability of a tile to have vegetation > 0
 */
export interface VegetationPainterConfig {
  seed: number;
  noiseScale: number;
  densityThreshold: number;
}

/**
 * Default painter: rules + noise.
 *
 * Idea:
 *  - BiomeDefinition say "which types" and "how common" (VegetationProfile)
 *  - We use noise 2D to decide:
 *    * if the tile has vegetation (presenceNoise)
 *    * which type is chosen (typeNoise)
 *  - After we use another noise + moisture to mold height/density
 *    around of the type's base value.
 */
export class DefaultVegetationPainter implements VegetationPainter {
  private readonly baseSeed: number;
  private readonly baseNoise: (x: number, y: number) => number;

  constructor(private readonly config: VegetationPainterConfig) {
    if (config.noiseScale <= 0) {
      throw new Error('VegetationPainterConfig.noiseScale must be greater than 0');
    }

    this.baseSeed = hashStringToInt(config.seed + '|vegetation');
    this.baseNoise = makeValueNoise2D(this.baseSeed);
  }

  paint(ctx: VegetationPainterContext): VegetationTile {
    const { worldX, worldY, biome, terrain, moisture } = ctx;

    // 1) Perfil de vegetação do bioma
    const profile = biome.vegetation as VegetationProfile | undefined;
    if (!profile || Object.keys(profile).length === 0) {
      return this.makeNoneTile();
    }

    // 2) Coordenadas normalizadas para o noise
    const nx = worldX / this.config.noiseScale;
    const ny = worldY / this.config.noiseScale;

    // Noise para "presença" de vegetação (clareiras, manchas, etc.)
    const presenceNoise = interpolatedValueNoise2D(this.baseNoise, nx, ny); // 0..1

    // Regra base: abaixo do threshold, não colocamos vegetação
    // (isso gera clareiras dentro de biomas verdes)
    if (presenceNoise < this.config.densityThreshold) {
      return this.makeNoneTile();
    }

    // 3) Noise separado para escolher o tipo de vegetação (descorrelacionado)
    const typeNoise = interpolatedValueNoise2D(
      this.baseNoise,
      nx + 37.21,
      ny + 91.73
    ); // 0..1

    const selectedType = this.pickVegetationType(profile, typeNoise);

    // Se o tipo escolhido for 'none', retornamos vazio
    if (selectedType === 'none') {
      return this.makeNoneTile();
    }

    // 4) Calcula height/density em torno do valor base do tipo
    // Outro noise pra variar visualmente altura/densidade dentro do patch
    const detailNoise = interpolatedValueNoise2D(
      this.baseNoise,
      nx + 123.45,
      ny + 678.9
    ); // 0..1

    const baseTile = createVegetationTile(selectedType);

    const moistureFactor = 0.5 + this.clamp01(moisture) * 0.5; // 0.5..1

    const height = this.clamp01(
      baseTile.height * (0.75 + detailNoise * 0.5)
    );
    const density = this.clamp01(
      baseTile.density *
      (0.5 + detailNoise * 0.5) *
      moistureFactor
    );

    return {
      type: selectedType,
      height,
      density,
    };
  }

  /**
   * Sort a vegetation type based on VegetationProfile biome,
   * using a value in [0,1] (typeNoise).
   */
  private pickVegetationType(
    profile: VegetationProfile,
    noise01: number
  ): VegetationType | 'none' {
    const entries = Object.entries(profile) as [VegetationType | 'none', number][];

    let totalWeight = 0;
    for (const [, weight] of entries) {
      if (weight > 0) totalWeight += weight;
    }

    if (totalWeight <= 0) {
      return 'none';
    }

    const roll = noise01 * totalWeight;
    let acc = 0;

    for (const [type, weight] of entries) {
      if (weight <= 0) continue;
      acc += weight;
      if (roll <= acc) {
        return type;
      }
    }

    // Fallback defensivo
    return entries[entries.length - 1][0];
  }

  private makeNoneTile(): VegetationTile {
    return createVegetationTile('none');
  }

  private clamp01(value: number): number {
    if (Number.isNaN(value)) return 0;
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
  }
}
