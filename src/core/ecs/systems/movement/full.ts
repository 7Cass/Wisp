import {Simulation} from '../../../simulation';
import {Entity} from '../../entities';
import {isMovableKind} from '../../../math';
import {AIState} from '../../components';
import {canEntityWalkTo} from '../../../world/occupancy';

export interface Direction {
  dx: number;
  dy: number;
}

type Position = {
  x: number;
  y: number;
}

/**
 * Complete movement for entity in FULL chunks
 * It's basically the current movement, but applied to ONE entity at time.
 */
export function movementFull(
  sim: Simulation,
  entity: Entity,
  position: Position
): void {
  const { ecs, world, events, chunkManager } = sim;

  const kind = ecs.kinds.get(entity);
  if (!kind || !isMovableKind(kind.kind)) {
    return;
  }

  const aiState: AIState | undefined = ecs.aiStates.get(entity);
  const mode = aiState?.mode ?? 'idle';

  if (mode === 'engaged') {
    return;
  }

  const targetEntity: Entity | undefined = aiState?.target;

  let dx = 0;
  let dy = 0;

  // Helper para validar se um tile pode ser pisado
  const canMoveTo = (x: number, y: number): boolean => {
    const result = canEntityWalkTo(sim, entity, x, y);
    return result.ok;
  };

  if (!aiState || mode === 'idle' || !targetEntity) {
    // IDLE ou sem AIState/target → movimento aleatório
    const step = randomStep();
    dx = step.dx;
    dy = step.dy;
  } else {
    const targetPos = ecs.positions.get(targetEntity);

    if (!targetPos) {
      // Alvo sumiu → random
      const step = randomStep();
      dx = step.dx;
      dy = step.dy;
    } else {
      const currentDist =
        Math.abs(targetPos.x - position.x) +
        Math.abs(targetPos.y - position.y);

      if (mode === 'chase') {
        // CHASE simples: tenta aproximar pelo melhor eixo
        const dxRaw = targetPos.x - position.x;
        const dyRaw = targetPos.y - position.y;

        const candidates: Direction[] = [];

        // Eixo dominante primeiro
        if (Math.abs(dxRaw) >= Math.abs(dyRaw)) {
          candidates.push({ dx: Math.sign(dxRaw), dy: 0 });
          if (dyRaw !== 0) candidates.push({ dx: 0, dy: Math.sign(dyRaw) });
        } else {
          candidates.push({ dx: 0, dy: Math.sign(dyRaw) });
          if (dxRaw !== 0) candidates.push({ dx: Math.sign(dxRaw), dy: 0 });
        }

        // Tenta na ordem
        for (const cand of candidates) {
          const nx = position.x + cand.dx;
          const ny = position.y + cand.dy;
          if (canMoveTo(nx, ny)) {
            dx = cand.dx;
            dy = cand.dy;
            break;
          }
        }

        // Se nada funcionou, fallback random
        if (dx === 0 && dy === 0) {
          const step = randomStep();
          dx = step.dx;
          dy = step.dy;
        }
      } else if (mode === 'flee') {
        // FLEE: tenta TODAS as direções que aumentam a distância ao alvo
        const allDirs: Direction[] = [
          { dx: 1, dy: 0 },
          { dx: -1, dy: 0 },
          { dx: 0, dy: 1 },
          { dx: 0, dy: -1 },
        ];

        const candidates = allDirs
          .map(dir => {
            const nx = position.x + dir.dx;
            const ny = position.y + dir.dy;
            const dist =
              Math.abs(targetPos.x - nx) + Math.abs(targetPos.y - ny);
            return { ...dir, nx, ny, dist };
          })
          // Só consideramos movimentos que AUMENTAM a distância atual
          .filter(c => c.dist > currentDist)
          // Tenta primeiro os que mais aumentam a distância
          .sort((a, b) => b.dist - a.dist);

        for (const cand of candidates) {
          if (canMoveTo(cand.nx, cand.ny)) {
            dx = cand.dx;
            dy = cand.dy;
            break;
          }
        }

        // Se não achou nada que aumente a distância ou tudo bloqueado → fallback random
        if (dx === 0 && dy === 0) {
          const step = randomStep();
          dx = step.dx;
          dy = step.dy;
        }
      }
    }
  }

  // If for some reason didn't choose a movement, do nothing.
  if (dx === 0 && dy === 0) {
    return;
  }

  const targetX = position.x + dx;
  const targetY = position.y + dy;

  // Out of bounds
  const result = canEntityWalkTo(sim, entity, targetX, targetY);
  if (!result.ok) {
    const reason = result.reasons[0] ?? 'terrain';
    events.emit({
      type: 'blocked_move',
      payload: {
        entity,
        from: { x: position.x, y: position.y },
        to: { x: targetX, y: targetY },
        reason,
        tick: world.tick,
      },
    });
    return;
  }

  // Successful movement
  const from = { x: position.x, y: position.y };
  position.x = targetX;
  position.y = targetY;


  chunkManager.moveEntity(entity, from.x, from.y, targetX, targetY);

  events.emit({
    type: 'move',
    payload: {
      entity,
      from,
      to: { x: targetX, y: targetY },
      tick: world.tick,
    },
  });
}

function randomStep(): { dx: number; dy: number } {
  const options: Direction[] = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ] as const;

  return options[Math.floor(Math.random() * options.length)];
}
