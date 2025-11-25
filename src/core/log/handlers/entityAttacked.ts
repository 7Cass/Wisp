import {EntityAttackedPayload, Event} from '../../events';
import {Simulation} from '../../simulation';
import {appendLog} from '../logState';

export function entityAttackedHandler(event: Event, simulation: Simulation): void {
  const { ecs, log } = simulation;
  const { attacker, defender, tick } = event.payload as EntityAttackedPayload;

  const attackerRace = ecs.races.get(attacker)?.race ?? 'unknown';
  const defenderRace = ecs.races.get(defender)?.race ?? 'unknown';

  appendLog(
    log,
    tick,
    `${attackerRace} #${attacker} attack ${defenderRace} #${defender}.`,
  );
}
