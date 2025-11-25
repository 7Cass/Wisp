import {Simulation} from '../../simulation';
import {Entity} from '../entities';
import {Position, Vision} from '../components';
import {isMovableKind} from '../../math';

export function perceptionSystem(simulation: Simulation): void {
  const { ecs } = simulation;
  for (const [observer, vision]: [Entity, Vision] of ecs.visions) {
    const observerPosition = ecs.positions.get(observer);

    if (!observerPosition) {
      continue;
    }

    for (const [target, targetPosition]: [Entity, Position] of ecs.positions) {
      if (target === observer) {
        continue;
      }

      const dx = targetPosition.x - observerPosition.x;
      const dy = targetPosition.y - observerPosition.y;
      const distance = Math.abs(dx) + Math.abs(dy);

      if (distance <= vision.radius) {
        simulation.events.emit({
          type: 'entity_seen',
          payload: {
            observer,
            target,
            distance,
            tick: simulation.world.tick,
          }
        });
      }
    }
  }
}
