import {Simulation} from '../../simulation';
import {Entity} from '../entities';
import {EntityDiedPayload} from '../../events';

export function removeEntity(simulation: Simulation, entity: Entity): void {
  const { ecs, chunkManager } = simulation;

  ecs.kinds.set(entity, { kind: 'corpse' });
  ecs.appearances.set(entity, { glyph: '%' });

  ecs.aiStates.delete(entity);
  ecs.healths.delete(entity);
  ecs.attacks.delete(entity);
}

export function deathSystem(simulation: Simulation): void {
  const { events } = simulation;

  for (const event of events.events) {
    if (event.type !== 'entity_died') {
      continue;
    }

    const { entity } = event.payload as EntityDiedPayload;

    removeEntity(simulation, entity);
  }
}
