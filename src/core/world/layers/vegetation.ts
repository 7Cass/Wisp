export type VegetationType =
  | 'none'
  | 'grass'
  | 'tall_grass'
  | 'flower'
  | 'bush'
  | 'berry_bush'
  | 'tree'
  | 'pine_tree'
  | 'lily'
  | 'reed';

export interface VegetationTile {
  type: VegetationType;
  /**
   * Density of the vegetation in the tile.
   * Interval: 0.0 (nothing) - 1.0 (dense)
   * Can be used for:
   *  - hide chance
   *  - move cost
   *  - fire spread
   *  - resources generation
   */
  density: number;

  /**
   * Approximated height for vegetation in the tile.
   * Interval: 0.0 (short) - 1.0 (tall)
   * Can be used for:
   *  - block/partial of line of sight
   *  - penalty for projectiles
   *  - narrative penalty ("tall grass", "thick forest", etc.)
   */
  height: number;
}

/**
 * Helper to create a VegetationTile with coherent defaults for each vegetation type.
 * @param type
 */
export function createVegetationTile(type: VegetationType): VegetationTile {
  switch (type) {
    case 'none':
      return { type, density: 0.0, height: 0.0 };
    case 'grass':
      return { type, density: 0.2, height: 0.1 };
    case 'tall_grass':
      return { type, density: 0.4, height: 0.3 };
    case 'flower':
      return { type, density: 0.3, height: 0.2 };
    case 'bush':
      return { type, density: 0.6, height: 0.4 };
    case 'berry_bush':
      return { type, density: 0.7, height: 0.5 };
    case 'tree':
      return { type, density: 0.9, height: 0.9 };
    case 'pine_tree':
      return { type, density: 0.9, height: 1.0 };
    case 'lily':
      return { type, density: 0.3, height: 0.1 };
    case 'reed':
      return { type, density: 0.7, height: 0.5 };

    default:
      return { type, density: 0.0, height: 0.0 };
  }
}

/**
 * Indicates if the vegetation is "solid" for movement.
 * @param veg The vegetation tile.
 */
export function isVegetationSolid(veg: VegetationTile | null | undefined): boolean {
  if (!veg) return false;

  switch (veg.type) {
    case 'tree':
    case 'pine_tree':
      return true;

    default:
      return false;
  }
}

/**
 * Indicates if the vegetation block totally the line of sight.
 * Here we use height/density as a signal:
 *  - tall/dense trees and bushes can block vision
 *  - grass, flowers and lily don't
 *
 * @param veg The vegetation tile.
 */
export function isVegetationOpaque(veg: VegetationTile | null | undefined): boolean {
  if (!veg) return false;

  switch (veg.type) {
    case 'tree':
    case 'pine_tree':
      return true;

    case 'bush':
    case 'berry_bush':
    case 'reed':
      // Semi-opaque by now.
      // Later can turn into "penalty" instead of total block.
      return veg.height >= 0.4 && veg.density >= 0.5;

    default:
      return false;
  }
}

/**
 * Map vegetation to char for terminal adapter. (this shouldn't be here but whatever)
 * Pure visual, can be enhanced later.
 *
 * @param veg The vegetation tile.
 */
export function vegetationToChar(veg: VegetationTile | null | undefined): string {
  if (!veg || veg.type === 'none') return '';

  switch (veg.type) {
    case 'grass':
      return ',';
    case 'tall_grass':
      return '"';
    case 'flower':
      return '❀';

    case 'bush':
      return '&';
    case 'berry_bush':
      return '%';

    case 'tree':
      return '♣';
    case 'pine_tree':
      return 'Λ';

    case 'lily':
      return '⁕';
    case 'reed':
      return '|';

    default:
      return '?';
  }
}
