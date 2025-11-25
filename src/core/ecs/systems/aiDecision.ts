import {Simulation} from '../../simulation';
import {isEnemy} from '../../ai/relations';
import {AIState, Health} from '../components';
import {Entity} from '../entities';
import {EntityEngagedPayload, EntitySeenPayload} from '../../events';
import {isMovableKind} from '../../math';

const LOW_HP_THRESHOLD = 0.3; // 30%

function isLowHp(health: Health | undefined): boolean {
  if (!health) return false;
  return health.current / health.baseHealth <= LOW_HP_THRESHOLD;
}

export function aiDecisionSystem(simulation: Simulation): void {
  const { ecs, events } = simulation;

  const previousStates = new Map<Entity, AIState>();
  for (const [entity, aiState]: [Entity, AIState] of ecs.aiStates) {
    previousStates.set(entity, { mode: aiState.mode, target: aiState.target });
    aiState.mode = 'idle';
    aiState.target = undefined;
  }

  for (const event of events.events) {
    if (event.type === 'entity_seen') {
      const { observer, target, distance } = event.payload as EntitySeenPayload;

      const kind = ecs.kinds.get(target);
      if (!kind || !isMovableKind(kind.kind)) {
        continue;
      }

      const observerRace = ecs.races.get(observer)?.race;
      const targetRace = ecs.races.get(target)?.race;
      if (!observerRace || !targetRace) {
        continue;
      }

      if (!isEnemy(observerRace, targetRace)) {
        continue;
      }

      const aiState = ecs.aiStates.get(observer);
      if (!aiState) {
        continue;
      }

      const behavior = ecs.behaviors.get(observer);

      if (behavior) {
        // 🔹 Novo fluxo: comportamento por entidade
        switch (behavior.reactionToEnemy) {
          case 'fight': {
            aiState.mode = 'chase';
            aiState.target = target;
            break;
          }
          case 'flight': {
            aiState.mode = 'flee';
            aiState.target = target;
            break;
          }
          case 'random': {
            // decide na hora
            const roll = Math.random();
            if (roll < 0.5) {
              aiState.mode = 'chase';
            } else {
              aiState.mode = 'flee';
            }
            aiState.target = target;
            break;
          }
        }
      }
    }
  }

  for (const [entity, aiState]: [Entity, AIState] of ecs.aiStates) {
    if (aiState.mode !== 'chase' || !aiState.target) {
      continue;
    }

    const attacker = entity;
    const defender = aiState.target;

    const attackerPosition = ecs.positions.get(attacker);
    const defenderPosition = ecs.positions.get(defender);

    if (!attackerPosition || !defenderPosition) {
      continue;
    }

    const distance =
      Math.abs(attackerPosition.x - defenderPosition.x) +
      Math.abs(attackerPosition.y - defenderPosition.y);

    if (distance !== 1) {
      continue;
    }

    // --- AQUI COMEÇA A LÓGICA DE FUGIR ANTES DE ENGAJAR ---

    const attackerHealth = ecs.healths.get(attacker);
    const defenderHealth = ecs.healths.get(defender);

    const defenderAi = ecs.aiStates.get(defender);

    // 1) Chance do defensor fugir (vítima)
    // baseChance:
    //   - se já está em flee -> 5%
    //   - se não estiver em flee -> 0%
    // bônus:
    //   - se HP baixo -> +10%
    let defenderFleeChance = 0;

    if (defenderAi?.mode === 'flee') {
      defenderFleeChance += 0.05; // 5%
    }
    if (isLowHp(defenderHealth)) {
      defenderFleeChance += 0.10; // +10%
    }

    if (defenderFleeChance > 0 && Math.random() < defenderFleeChance) {
      // Defensor decide fugir em vez de engajar
      const newDefenderAi: AIState = defenderAi ?? { mode: 'flee', target: attacker };
      newDefenderAi.mode = 'flee';
      newDefenderAi.target = attacker;
      ecs.aiStates.set(defender, newDefenderAi);

      // Atacante continua em 'chase' normalmente.
      // Não marcamos 'engaged' aqui.
      continue;
    }

    // 2) Chance do atacante desistir (só se estiver com HP baixo)
    let attackerFleeChance = 0;
    if (isLowHp(attackerHealth)) {
      attackerFleeChance += 0.10; // 10% se HP baixo
    }

    if (attackerFleeChance > 0 && Math.random() < attackerFleeChance) {
      // Atacante desiste e tenta fugir em vez de engajar
      aiState.mode = 'flee';
      aiState.target = defender;
      continue;
    }

    // --- Se ninguém fugiu, ENGAGE NORMAL COMO ANTES ---

    aiState.mode = 'engaged';

    let defenderEngagedAi = ecs.aiStates.get(defender);
    if (!defenderEngagedAi) {
      defenderEngagedAi = { mode: 'engaged', target: attacker };
      ecs.aiStates.set(defender, defenderEngagedAi);
    } else {
      defenderEngagedAi.mode = 'engaged';
      defenderEngagedAi.target = attacker;
    }

    events.emit({
      type: 'entity_engaged',
      payload: {
        attacker,
        defender,
        tick: simulation.world.tick,
      } satisfies EntityEngagedPayload,
    });
  }

  for (const [entity, aiState] of ecs.aiStates) {
    const prev = previousStates.get(entity);
    if (!prev) continue;

    if (prev.mode !== aiState.mode || prev.target !== aiState.target) {
      events.emit({
        type: 'ai_mode_changed',
        payload: {
          entity,
          from: prev.mode,
          to: aiState.mode,
          target: aiState.target,
          tick: simulation.world.tick,
        },
      });
    }
  }
}
