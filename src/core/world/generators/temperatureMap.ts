import {mulberry32} from '../../random/prng';
import {hashStringToInt} from '../../random/hashing';

/**
 * Temperature map: returns a value normalized in [0,1]
 * representing how warm that point in the world is.
 *
 * 0.0 -> very cold (polar / high mountains)
 * 1.0 -> very hot (tropical / low altitude near the equator)
 */
export interface TemperatureMap {
  get(x: number, y: number, altitude?: number): number;
}

/**
 * Temperature generator configuration
 *
 *  - worldHeight: used to calculate "latitude" (equator ~ middle of the map)
 *  - scale/octaves/persistence/lacunatiry: controls the noise
 *  - latitudeWeight/altitudeWeight: relative weight of each factor
 *  - noiseStrength: how much the noise diverse fom the climate tendency
 */
export interface TemperatureMapConfig {
  seed: string;

  /**
   * Total world height in tiles.
   * Used to normalize y into a 0..1 latitude.
   */
  worldHeight: number;

  /**
   * Global noise scale.
   *  - higher values => larger temperature regions
   *  - lower values => more noisy / patchy variation
   */
  scale: number;

  /**
   * Number of noise octaves (multi-frequency).
   */
  octaves: number;

  /**
   * How much the amplitude decreases each octave.
   */
  persistence: number;

  /**
   * Frequency multiplier each octave.
   */
  lacunarity: number;

  /**
   * Relative weight of latitude in the temperature.
   * latitudeWeight + altitudeWeight não precisam somar 1,
   * nós normalizamos depois.
   */
  latitudeWeight: number;

  /**
   * Relative weight of altitude in the temperature.
   * Ex: 0.7 latitude / 0.3 altitude é um bom ponto de partida.
   */
  altitudeWeight: number;

  /**
   * How much noise perturbs the final temperature.
   * 0 -> sem ruído, só latitude+altitude.
   * 0.3 -> 30% de influência de ruído.
   */
  noiseStrength: number;
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
 * Concrete TemperatureMap implementation based on:
 *  - latitude (y / worldHeight)
 *  - altitude (optional)
 *  - 2D value noise + octaves for local variation
 *
 * Results:
 *  - more warm in the middle of the map (equator)
 *  - more cold in top/base (poles)
 *  - more cold in higher altitudes
 *  - smooth noise to break perfect lines
 */
export class ValueNoiseTemperatureMap implements TemperatureMap {
  private readonly baseSeed: number;
  private readonly baseNoise: (x: number, y: number) => number;

  constructor(private readonly config: TemperatureMapConfig) {
    if (this.config.worldHeight <= 0) {
      throw new Error('TemperatureMapConfig.worldHeight must be greater than 0');
    }

    if (this.config.scale <= 0) {
      throw new Error('TemperatureMapConfig.scale must be greater than 0');
    }

    this.baseSeed = hashStringToInt(config.seed + '|temperature');
    this.baseNoise = makeValueNoise2D(this.baseSeed);
  }

  get(x: number, y: number, altitude?: number): number {
    const {
      worldHeight,
      scale,
      octaves,
      persistence,
      lacunarity,
      latitudeWeight,
      altitudeWeight,
      noiseStrength
    } = this.config;

    // Base latitude
    // Normalize y in [0,1]
    const latNorm = worldHeight > 1 ? y / (worldHeight - 1) : 0.5;

    // Equator in the middle: highest value in the center, lower on the borders.
    const latTemp = 1 - 2 * Math.abs(latNorm - 0.5);

    // Altitude base
    const clampedAlt = Math.max(0, Math.min(1, altitude));
    const altTemp = 1 - clampedAlt;

    // Combine latitude + altitude
    const totalWeight = latitudeWeight + altitudeWeight;
    let climaticTemp: number;
    if (totalWeight > 0) {
      climaticTemp = (latTemp * latitudeWeight + altTemp * altitudeWeight) / totalWeight;
    } else {
      climaticTemp = latTemp;
    }

    // Temperature noise (climatic micro-variation)
    let amplitude = 1.0;
    let frequency = 1.0;
    let maxAmplitude = 0.0;
    let sum = 0.0;

    for (let o = 0; o < octaves; o++) {
      const nx = (x / scale) * frequency;
      const ny = (y / scale) * frequency;

      const n = interpolatedValueNoise2D(this.baseNoise, nx, ny); // 0..1

      sum += n * amplitude;
      maxAmplitude += amplitude;

      amplitude *= persistence;
      frequency *= lacunarity;
    }

    let noiseValue = 0.0;
    if (maxAmplitude > 0) {
      noiseValue = sum / maxAmplitude;
    }

    // Combine base climate with noise
    const ns = Math.max(0, Math.min(1, noiseStrength));
    let temp = climaticTemp * (1 - ns) + noiseValue * ns;

    // Final clamp
    temp = Math.max(0, Math.min(1, temp));

    // Smooth curve to get a little bit more of the extremes (optional)
    temp = Math.pow(temp, 0.95);

    return temp;
  }
}
