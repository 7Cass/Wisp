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
  seed: string;

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

