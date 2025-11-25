import {Simulation} from '../../simulation';
import {appendLog} from '../../log/logState';
import {EntityEngagedPayload, Event} from '../../events';

export function entityEngagedHandler(event: Event, simulation: Simulation): void {
  const { ecs, log } = simulation;

  const { attacker, defender, tick } = event.payload as EntityEngagedPayload;
  const attackerRace = ecs.races.get(attacker)?.race ?? 'unknown';
  const defenderRace = ecs.races.get(defender)?.race ?? 'unknown';

  appendLog(
    log,
    tick,
    `${attackerRace} #${attacker} entered combat with ${defenderRace} #${defender}`,
  );
}
