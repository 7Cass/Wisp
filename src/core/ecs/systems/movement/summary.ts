import {Simulation} from '../../../simulation';
import {Entity} from '../../entities';
import {inBounds, isMovableKind} from '../../../math';
import {isWalkableTerrain} from '../../../tile';

type Position = {
  x: number;
  y: number;
}

interface Direction {
  dx: number;
  dy: number;
}

/**
 * Very cheap movement for SUMMARY chunks.
 *
 *  - NO AI (no chase/flee, no target awareness)
 *  - Low chance of random drift
 *  - Keeps world invariants (no walking through walls, no overlapping entities)
 *  - Does NOT emit events (no logs, no story impact)
 */
export function movementSummary(
  sim: Simulation,
  entity: Entity,
  position: Position
): void {
  const { ecs, world, chunkManager } = sim;

  const kind = ecs.kinds.get(entity);
  if (!kind || !isMovableKind(kind.kind)) {
    return;
  }

  // 95% of chance to do nothing
  if (Math.random() < 0.95) {
    return;
  }

  const { dx, dy } = randomStep();

  const targetX = position.x + dx;
  const targetY = position.y + dy;

  // Out of bounds
  if (!inBounds(world, targetX, targetY)) {
    return;
  }

  // Basic terrain collision
  const tile = chunkManager.getTerrainAt(targetX, targetY);
  if (!tile || !isWalkableTerrain(tile)) {
    return;
  }

  // Collision with other entities
  const others = chunkManager.getEntitiesAt(ecs, targetX, targetY);
  if (others.length > 0) {
    return;
  }

  // Silent move (no events)
  const fromX = position.x;
  const fromY = position.y;

  position.x = targetX;
  position.y = targetY;

  chunkManager.moveEntity(entity, fromX, fromY, targetX, targetY);
}

function randomStep(): { dx: number; dy: number } {
  const options: Direction[] = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];

  return options[Math.floor(Math.random() * options.length)];
}
