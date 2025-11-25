import {Simulation} from '../simulation';
import {Entity} from '../ecs/entities';

export function ensureFocusedEntity(simulation: Simulation): void {
  const { ecs } = simulation;
  const current = simulation.focusedEntity;

  if (current !== null && ecs.positions.has(current)) {
    return;
  }

  const iterator = ecs.positions.keys();
  const first = iterator.next();

  if (!first.done) {
    simulation.focusedEntity = first.value as Entity;
  } else {
    simulation.focusedEntity = null;
  }
}

/**
 * Return all entities that has position ordered by id
 */
function getEntitiesInOrder(sim: Simulation): Entity[] {
  const entities = Array.from(sim.ecs.positions.keys()) as Entity[];
  entities.sort((a, b) => a - b);
  return entities;
}

/**
 * Move the focus to the next entity (order by id, with wrap-around)
 */
export function focusNext(sim: Simulation): void {
  const entities = getEntitiesInOrder(sim);

  if (entities.length === 0) {
    sim.focusedEntity = null;
    return;
  }

  const current = sim.focusedEntity;

  // If no current focus, start at first entity
  if (current === null) {
    sim.focusedEntity = entities[0];
    return;
  }

  const currentIndex = entities.indexOf(current);

  // If the current focus isn't in the list anymore (removed, etc)
  if (currentIndex === -1) {
    sim.focusedEntity = entities[0];
    return;
  }

  const nextIndex = (currentIndex + 1) % entities.length;
  sim.focusedEntity = entities[nextIndex];
}

/**
 * Move focus to the previous entity (ordered by id, with wrap-around)
 */
export function focusPrevious(sim: Simulation): void {
  const entities = getEntitiesInOrder(sim);

  if (entities.length === 0) {
    sim.focusedEntity = null;
    return;
  }

  const current = sim.focusedEntity;

  if (current === null) {
    sim.focusedEntity = entities[0];
    return;
  }

  const currentIndex = entities.indexOf(current);

  if (currentIndex === -1) {
    sim.focusedEntity = entities[0];
    return;
  }

  const prevIndex = (currentIndex - 1 + entities.length) % entities.length;
  sim.focusedEntity = entities[prevIndex];
}

