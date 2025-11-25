import {Simulation} from '../../simulation';
import {EntityDiedPayload, Event} from '../../events';
import {appendLog} from '../logState';

export function entityDiedHandler(event: Event, simulation: Simulation): void {
  const { ecs, log } = simulation;
  const { entity, killedBy, tick } = event.payload as EntityDiedPayload;

  const race = ecs.races.get(entity)?.race ?? 'unknown';
  const killerRace =
    killedBy !== undefined ? ecs.races.get(killedBy)?.race : undefined;

  let msg = `${race} #${entity} died.`;
  if (killedBy !== undefined && killerRace) {
    msg += ` (killed by ${killerRace} #${killedBy})`;
  }

  appendLog(log, tick, msg);
}
