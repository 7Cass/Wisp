import {isWalkableTerrain, TerrainTile} from '../tile';
import {isVegetationSolid, VegetationTile} from './layers/vegetation';
import {Entity} from '../ecs/entities';
import {Simulation} from '../simulation';
import {inBounds} from '../math';
import {WalkBlockReason} from '../events';
import {Kind, KindId} from '../ecs/components';

/**
 * Reasons that a tile is considered "occupied" / blocked.
 * Not necessarily exclusives (e.g: terrain + entity at the same time).
 */
export type TileOccupationReason =
  | 'out_of_bounds'
  | 'terrain_blocked'
  | 'vegetation_blocked'
  | 'entity_blocked';

/**
 * Complete vision of "what is in this tile".
 */
export interface TileOccupationInfo {
  /**
   * If the tile is blocked for generic movement.
   * (Any one of the `reasons` being blocking turns this true.)
   */
  blocked: boolean;

  /**
   * A list of reasons that makes the tile blocked (if it has).
   */
  reasons: TileOccupationReason[];

  /**
   * Current terrain on tile (or null if it's out of bounds / no chunk).
   */
  terrain: TerrainTile | null;

  /**
   * Current vegetation on tile (or null if it's out of bounds / no chunk).
   */
  vegetation: VegetationTile | null;

  /**
   * Entities that occupy the tile in that tick.
   */
  entities: Entity[];
}

/**
 * Result of a movement check for a given entity.
 */
export interface WalkCheckResult {
  /**
   * `true` if the entity can walk to (x,y) on current rules.
   */
  ok: boolean;

  /**
   * List of reasons why CAN'T walk (if ok === false).
   */
  reasons: WalkBlockReason[];

  /**
   * Complete snapshot of the tile occupation.
   */
  occupation: TileOccupationInfo;
}

/**
 * List of blocking entities
 *  - creature
 *  - structure
 */
const BLOCKING_ENTITY_KINDS = new Set<KindId>(['creature', 'structure']);

/**
 * Checks everything that is present in (x,y):
 *  - world limits
 *  - terrain
 *  - vegetation
 *  - entities
 *
 * This function DON'T know "who" is moving.
 * Only write the tile.
 */
export function getTileOccupation(
  sim: Simulation,
  x: number,
  y: number
): TileOccupationInfo {
  const { world, chunkManager, ecs } = sim;

  // Out of world bounds -> blocked immediately.
  if (!inBounds(world, x, y)) {
    return {
      blocked: true,
      reasons: ['out_of_bounds'],
      terrain: null,
      vegetation: null,
      entities: [],
    };
  }

  // Inside the world -> we consult the ChunkManager
  const terrain = chunkManager.getTerrainAt(x, y);
  const vegetation = chunkManager.getVegetationAt(x,  y);
  const entities = chunkManager.getEntitiesAt(ecs, x, y);

  const blockingEntities: Entity[] = [];
  for (const entity of entities) {
    const kind = ecs.kinds.get(entity);
    if (!kind) continue;

    if (isBlockingEntityKind(kind)) {
      blockingEntities.push(entity);
    }
  }

  const reasons: TileOccupationReason[] = [];

  // Blocking terrain
  if (!isWalkableTerrain(terrain)) {
    reasons.push('terrain_blocked');
  }

  // Solid vegetation (e.g: trees, logs, etc.)
  if (isVegetationSolid(vegetation ?? undefined)) {
    reasons.push('vegetation_blocked');
  }

  // Any entity occupies the tile (default pedestrian)
  if (blockingEntities.length > 0) {
    reasons.push('entity_blocked');
  }

  return {
    blocked: reasons.length > 0,
    reasons,
    terrain: terrain ?? null,
    vegetation: vegetation ?? null,
    entities,
  };
}

/**
 * Converts a TileOccupationInfo in a more friendly
 * "can walk?" result for movement systems.
 *
 * This is the high level helper that the movementSystem should use.
 */
export function canEntityWalkTo(
  sim: Simulation,
  entity: Entity | null,
  x: number,
  y: number
): WalkCheckResult {
  const occ = getTileOccupation(sim, x, y);
  const reasons: WalkBlockReason[] = [];

  // Out of world
  if (occ.reasons.includes('out_of_bounds')) {
    reasons.push('out_of_bounds');
  }

  // Blocking terrain (wall, water, rocks, etc.)
  if (occ.reasons.includes('terrain_blocked')) {
    reasons.push('terrain');
  }

  // Blocking vegetation (tree, log, etc.)
  if (occ.reasons.includes('vegetation_blocked')) {
    reasons.push('vegetation');
  }

  // Other entity is occupying
  if (occ.reasons.includes('entity_blocked')) {
    reasons.push('entity');
  }

  // In the future we can apply specific rules by race/kind entities
  // e.g: boats ignores 'water', spirits ignores 'wall', etc.
  // Using `entity` and ECS components (race, traits, etc.)
  if (entity) {
    // logic goes here...
  }

  return {
    ok: reasons.length === 0,
    reasons,
    occupation: occ,
  }
}

/**
 * Verify if an entity can block a tile
 *
 * @param kind The kind of the entity
 */
function isBlockingEntityKind(kind: Kind | undefined): boolean {
  return !!kind && BLOCKING_ENTITY_KINDS.has(kind.kind);
}
