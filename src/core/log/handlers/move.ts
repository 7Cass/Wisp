import {appendLog} from '../logState';
import type {Event} from '../../events';
import type {Simulation} from '../../simulation';

export function moveHandler(event: Event, simulation: Simulation) {
  const { entity, from, to } = event.payload;

  const race = simulation.ecs.races.get(entity);
  const raceLabel = race?.race ?? 'unknown';

  appendLog(
    simulation.log,
    simulation.world.tick,
    `${raceLabel} #${entity} moved from (${from.x},${from.y}) to (${to.x},${to.y})`,
  );
}
