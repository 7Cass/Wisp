import type {BlockedMovePayload, Event} from '../../events';
import type {Simulation} from '../../simulation';
import {appendLog} from '../logState';

export function blockedMoveHandler(event: Event, simulation: Simulation) {
  const { entity, from, to, reason } = event.payload as BlockedMovePayload;

  const race = simulation.ecs.races.get(entity);
  const raceLabel = race?.race ?? 'unknown';

  let reasonText = '';
  if (reason === 'wall') reasonText = 'a wall';
  if (reason === 'out_of_bounds') reasonText = 'the edge of the world';
  if (reason === 'occupied') reasonText = 'another creature';

  appendLog(
    simulation.log,
    simulation.world.tick,
    `${raceLabel} #${entity} tried to move from (${from.x},${from.y}) to (${to.x},${to.y}) but was blocked by ${reasonText}.`
  );
}
