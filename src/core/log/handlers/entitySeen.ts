import type {EntitySeenPayload, Event} from '../../events';
import type {Simulation} from '../../simulation';
import {appendLog} from '../logState';

export function entitySeenHandler(event: Event, simulation: Simulation): void {
  const { observer, target, distance, tick } = event.payload as EntitySeenPayload;

  const observerRace = simulation.ecs.races.get(observer);
  const observerRaceLabel = observerRace?.race ?? 'unknown';

  const targetRace = simulation.ecs.races.get(target);
  const targetRaceLabel = targetRace?.race ?? 'unknown';

  appendLog(
    simulation.log,
    tick,
    `${observerRaceLabel} #${observer} saw ${targetRaceLabel} #${target} ${distance} tiles from distance`
  );
}
