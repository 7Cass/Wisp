import {Simulation} from '../../../simulation';
import {Entity} from '../../entities';
import {isMovableKind} from '../../../math';
import {canEntityWalkTo} from '../../../world/occupancy';

type Position = {
  x: number;
  y: number;
}

interface Direction {
  dx: number;
  dy: number;
}

/**
 * Simplified movement for MACRO chunks.
 *  - No chase/flee logic
 *  - Sometimes the entity simply does nothing
 *  - When it moves, it moves randomly
 *  - Still respects walls & entities collisions
 *  - Emits proper movement/blocked events
 */
export function movementMacro(
  sim: Simulation,
  entity: Entity,
  position: Position
): void {
  const { ecs, world, events, chunkManager } = sim;

  const kind = ecs.kinds.get(entity);
  if (!kind || !isMovableKind(kind.kind)) {
    return;
  }

  // Ex: 70% of chance of doing nothing
  if (Math.random() < 0.7) {
    return;
  }

  const { dx, dy } = randomStep();

  const targetX = position.x + dx;
  const targetY = position.y + dy;

  const result = canEntityWalkTo(sim, entity, targetX, targetY);
  // Out of bounds
  if (!result.ok) {
    const reason = result.reasons[0] ?? 'terrain';

    events.emit({
      type: 'blocked_move',
      payload: {
        entity,
        from: {
          x: position.x,
          y: position.y,
        },
        to: {
          x: targetX,
          y: targetY,
        },
        reason,
        tick: world.tick
      }
    });

    return;
  }

  // Success -> move & emit event
  const from = { x: position.x, y: position.y };
  position.x = targetX;
  position.y = targetY;

  chunkManager.moveEntity(entity, from.x, from.y, targetX, targetY);

  events.emit({
    type: 'move',
    payload: {
      entity,
      from,
      to: {
        x: targetX,
        y: targetY,
      },
      tick: world.tick
    }
  });
}

function randomStep(): Direction {
  const options: Direction[] = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1},
  ];
  return options[Math.floor(Math.random() * options.length)];
}
