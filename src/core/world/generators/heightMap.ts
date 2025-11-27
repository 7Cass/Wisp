import {hashStringToInt} from '../../random/hashing';
import {mulberry32} from '../../random/prng';

/**
 * Height map: returns a value normalized in [0, 1]
 * representing the altitude of that point in the world
 *
 * 0.0 -> lower regions (deep sea, valleys)
 * 0.2 -> approximated sea level (coasts, shallow waters)
 * 1.0 -> high regions (mountains)
 */
export interface HeightMap {
  get(x: number, y: number): number;
}

/**
 * Height generator configuration
 * It can be modified to tune the world "feeling".
 */
export interface HeightMapConfig {
  seed: number;

  /**
   * Global noise scale.
   *  - higher values => larger continents, slower variation
   *  - lower values => "zebra" like terrains
   *  Ex: 200-500 usually generates good continents
   */
  scale: number;

  /**
   * Number of noise octaves (multi-frequency).
   * 3-6 usually is a good range
   */
  octaves: number;

  /**
   * How much the amplitude decreases each octave.
   * 0.4-0.7 is a good interval for smooth terrains
   */
  persistence: number;

  /**
   * Frequency multiplier of each octave.
   * 1.8-2.5 is common.
   */
  lacunarity: number;
}

/**
 * Generates a deterministic 2D "hash" (x,y) -> [0,1] using base seed.
 * This is a value noise: each point in grid has a pseudo-random value.
 * @param baseSeed
 */
function makeValueNoise2D(baseSeed: number) {
  return (x: number, y: number): number => {
    // Round to a whole grid
    const xi = Math.floor(x);
    const yi = Math.floor(y);

    // Seed by cell
    // Semente por célula
    const cellSeed = (xi * 374761393 + yi * 668265263) ^ baseSeed;
    const rng = mulberry32(cellSeed >>> 0);

    return rng();
  }
}

/**
 * Smooth function (S-curve) for interpolation.
 * Used to prevent visual artifacts on cell blends.
 * @param t
 */
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
 * Concrete implementation of HeightMap based in noise 2D value + octaves.
 * Objective: generate continents with oceans, valleys and smooth mountains.
 */
export class ValueNoiseHeightMap implements HeightMap {
  private readonly baseNoise: (x: number, y: number) => number;

  constructor(private readonly config: HeightMapConfig) {
    this.baseNoise = makeValueNoise2D(config.seed);

    if (this.config.scale <= 0) {
      throw new Error('HeightMapConfig.scale must be greater than 0');
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

    // Multi-octave noise (fractal Brownian motion)
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

    // Normalize to [0,1]
    let height = sum / maxAmplitude;

    // Curve to increase contrast between seas / plains / mountains
    // Higher values tend to more terrain than water.
    height = Math.max(0, Math.min(1, height));

    // Curve to make oceans deeper and mountains sharper
    height = Math.pow(height, 1.2);

    return height;
  }
}
