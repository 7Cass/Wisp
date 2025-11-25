import {EntityDamagedPayload, Event} from '../../events';
import {Simulation} from '../../simulation';
import {appendLog} from '../logState';

export function entityDamagedHandler(event: Event, simulation: Simulation): void {
  const { ecs, log} = simulation;
  const { entity, amount, hpBefore, hpAfter, from, tick } = event.payload as EntityDamagedPayload;

  const race = ecs.races.get(entity)?.race ?? 'unknown';
  const fromRace = from ? ecs.races.get(from)?.race : undefined;

  let msg = `${race} #${entity} got ${amount} damage (${hpBefore} → ${hpAfter}).`;
  if (from && fromRace) {
    msg += ` (por ${fromRace} #${from})`;
  }

  appendLog(log, tick, msg);
}
