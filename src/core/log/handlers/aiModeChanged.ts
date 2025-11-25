import {Simulation} from '../../simulation';
import {AIModeChangedPayload, Event} from '../../events';
import {appendLog} from '../logState';

export function aiModeChangedHandler(event: Event, simulation: Simulation): void {
  const { ecs, log } = simulation;

  const { entity, from, to, target, tick } = event.payload as AIModeChangedPayload;
  const race = ecs.races.get(entity)?.race ?? 'unknown';
  const targetRace = target ? ecs.races.get(target)?.race : undefined;

  let message = `${race} #${entity} changed from ${from} to ${to}`;
  if (target && targetRace) {
    message += ` in relation to ${targetRace} #${target}`;
  }

  appendLog(log, tick, message);
}
