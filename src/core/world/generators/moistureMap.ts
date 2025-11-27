import {mulberry32} from '../../random/prng';
import {hashStringToInt} from '../../random/hashing';

/**
 * Moisture map: returns a value normalized in [0,1]
 * representing how we that point in the world is.
 *
 * 0.0 -> very dry (desert-like)
 * 1.0 -> very wet (swamp / rainforest-like)
 */
export interface MoistureMap {
  get(x: number, y: number): number;
}

/**
 * Moisture generator configuration.
 */
export interface MoistureMapConfig {
  seed: number;

  /**
   * Global noise scale.
   *  - higher values => large humidity regions
   *  - lower values => more patchy, noisy moisture
   *  Ex: 250–600 usually gives good climate-sized regions.
   */
  scale: number;

  /**
   * Number of noise octaves (multi-frequency).
   * 2–4 is usually enough for moisture.
   */
  octaves: number;

  /**
   * How much the amplitude decreases each octave.
   * 0.4–0.7 is a good interval.
   */
  persistence: number;

  /**
   * Frequency multiplier each octave.
   * 1.8–2.5 is common.
   */
  lacunarity: number;
}

/**
 * Generates a deterministic 2D "hash" (x,y) -> [0,1] using base seed.
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

/**
 * Smooth S-curve for interpolation.
 */
function smoothStep(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * Bilinear interpolation over the 4 corners of the current cell.
 */
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
 * Concrete MoistureMap implementation based on 2D value noise + octaves.
 *
 * You can think of it as a "climate" layer:
 *  - dry zones (future deserts, savannas)
 *  - medium (grasslands, temperate forests)
 *  - wet (swamps, tropical forests)
 */
export class ValueNoiseMoistureMap implements MoistureMap {
  private readonly baseSeed: number;
  private readonly baseNoise: (x: number, y: number) => number;

  constructor(private readonly config: MoistureMapConfig) {
    this.baseSeed = hashStringToInt(config.seed + '|moisture');
    this.baseNoise = makeValueNoise2D(this.baseSeed);

    if (this.config.scale <= 0) {
      throw new Error('MoistureMapConfig.scale must be greater than 0');
    }
  }

  get(x: number, y: number): number {
    const {
      scale,
      octaves,
      persistence,
      lacunarity
    } = this.config;

    let amplitude = 1.0;
    let frequency = 1.0;
    let maxAmplitude = 0.0;
    let sum = 0.0;

    for (let o = 0; o < octaves; o++) {
      const nx = (x / scale) * frequency;
      const ny = (y / scale) * frequency;

      const n = interpolatedValueNoise2D(this.baseNoise, nx, ny);

      sum += n * amplitude;
      maxAmplitude += amplitude;

      amplitude *= persistence;
      frequency *= lacunarity;
    }

    if (maxAmplitude <= 0) {
      return 0.0;
    }

    let moisture = sum / maxAmplitude;

    // Clamp to [0,1]
    moisture = Math.max(0, Math.min(1, moisture));

    moisture = Math.pow(moisture, 1.1);

    return moisture;
  }
}
