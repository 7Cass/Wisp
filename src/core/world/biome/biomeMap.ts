import {BiomeDefinition, BIOMES} from './biomeTypes';

/**
 * A BiomeMap can provide:
 *  - data (altitude, moisture, temperature) normalized in [0, 1]
 *  - which BiomeDefinition best suits
 */
export interface BiomeMap {
  pickBiome(
    altitude: number,
    moisture: number,
    temperature: number
  ): BiomeDefinition;
}

/**
 * Penalty for a value given an interval [min, max]:
 *  - 0 if the value is exactly at the center
 *  - low cost if it's inside the interval, but far from center
 *  - high cost if it's outside (distance till the interval)
 */
function rangePenalty(
  value: number,
  min: number,
  max: number
): number {
  if (min > max) {
    const tmp = min;
    min = max;
    max = tmp;
  }

  if (value < min) {
    return min - value;
  }

  if (value > max) {
    return value - max;
  }

  const center = (min + max) / 2;
  return Math.abs(value - center) * 0.1;
}

/**
 * Default implementation based in biome ranges
 *
 * The idea:
 *  - For each biome in Biomes, we calculate a "score" of how good (altitude, moisture, temperature) fit their ranges.
 *  - The lower the score, better it fits.
 *  - We return the biome with the lower score.
 *
 *  This allows us to:
 *    - Adjust the logic only changing BIOMES
 *    - Avoid giant hardcoded if-else
 */
export class RangeBasedBiomeMap implements BiomeMap {
  pickBiome(altitude: number, moisture: number, temperature: number): BiomeDefinition {
    let best: BiomeDefinition | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const biome of BIOMES) {
      const tempScore = rangePenalty(temperature, biome.minTemp, biome.maxTemp);
      const moistureScore = rangePenalty(moisture, biome.minMoisture, biome.maxMoisture);
      const altitureScore = rangePenalty(altitude, biome.minAltitude, biome.maxAltitude);

      const totalScore = tempScore + moistureScore + altitureScore;

      if (totalScore < bestScore) {
        bestScore = totalScore;
        best = biome;
      }
    }

    return best ?? BIOMES[0];
  }

}
