import type {BlockedMovePayload, Event} from '../../events';
import type {Simulation} from '../../simulation';
import {appendLog} from '../logState';

export function blockedMoveHandler(event: Event, simulation: Simulation) {
  if (event.type !== 'blocked_move') return;

  const payload = event.payload as BlockedMovePayload;

  const { entity, from, to, reason } = payload;

  const race = simulation.ecs.races.get(entity);
  const raceLabel = race?.race ?? 'unknown';

  let base = `${raceLabel} #${entity} tentou mover de (${from.x},${from.y}) para (${to.x},${to.y})`;

  switch (reason) {
    case 'out_of_bounds':
      base = `${base}, mas atingiu a borda do mundo.`;
      break;
    case 'terrain':
      base = `${base}, mas o terreno bloqueou o caminho.`;
      break;
    case 'vegetation':
      base = `${base}, mas a vegetação densa bloqueou a passagem.`;
      break;
    case 'entity':
      base = `${base}, mas outra criatura está no caminho.`;
      break;
    default:
      // fallback defensivo caso apareça algo inesperado
      base = `${base}, mas algo desconhecido bloqueou o caminho.`;
      break;
  }

  appendLog(
    simulation.log,
    simulation.world.tick,
    base,
  );
}
