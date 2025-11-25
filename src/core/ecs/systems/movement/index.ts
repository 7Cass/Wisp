import {Simulation} from '../../../simulation';
import {movementFull} from './full';
import {movementMacro} from './macro';
import {movementSummary} from './summary';

/**
 * Movement dispatcher based on simulationLevel chunk.
 */
export function movementSystem(sim: Simulation): void {
  const { ecs, chunkManager } = sim;

  for (const [entity, position] of ecs.positions) {
    const chunk = chunkManager.getChunkForTile(position.x, position.y);

    switch (chunk.simulationLevel) {
      case 'full':
        movementFull(sim, entity, position);
        break;
      case 'macro':
        movementMacro(sim, entity, position);
        break;
      case 'summary':
      default:
        movementSummary(sim, entity, position);
        break;
    }
  }
}
