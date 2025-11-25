import {Simulation} from '../../simulation';
import {Entity} from '../entities';

export function combatSystem(simulation: Simulation): void {
  const { ecs, events, world } = simulation;

  for (const [entity, aiState] of ecs.aiStates) {
    if (aiState.mode !== 'engaged' || !aiState.target) {
      continue;
    }

    const attacker: Entity = entity;
    const defender: Entity = aiState.target;

    const attackerHealth = ecs.healths.get(entity);
    const attackerDamage = ecs.attacks.get(entity);
    const defenderHealth = ecs.healths.get(defender);

    if (!attackerHealth || !attackerDamage || !defenderHealth) {
      continue;
    }

    if (attackerHealth.current <= 0 || defenderHealth.current <= 0) {
      continue;
    }

    const hitRoll = Math.random();

    if (hitRoll < 0.1) {
      events.emit({
        type: 'entity_attacked',
        payload: {
          attacker,
          defender,
          tick: world.tick,
        }
      });

      continue;
    }

    const damage = attackerDamage.baseDamage;
    const hpBefore = defenderHealth.current;
    const hpAfter = Math.max(0, hpBefore - damage);

    defenderHealth.current = hpAfter;

    events.emit({
      type: 'entity_attacked',
      payload: {
        attacker,
        defender,
        tick: world.tick,
      },
    });

    events.emit({
      type: 'entity_damaged',
      payload: {
        entity: defender,
        amount: damage,
        from: attacker,
        hpBefore,
        hpAfter,
        tick: world.tick,
      },
    });

    if (hpAfter <= 0) {
      events.emit({
        type: 'entity_died',
        payload: {
          entity: defender,
          killedBy: attacker,
          tick: world.tick,
        }
      });
    }
  }
}
