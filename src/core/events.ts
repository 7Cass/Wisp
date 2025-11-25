import {Entity} from './ecs/entities';
import {AIMode} from './ecs/components';

export { EventBus } from './events/eventBus';

export interface MoveEventPayload {
  entity: Entity;
  from: { x: number; y: number };
  to: { x: number; y: number };
  tick: number;
}

export interface BlockedMovePayload {
  entity: Entity;
  from: { x: number; y: number };
  to: { x: number; y: number };
  reason: 'out_of_bounds' | 'wall' | 'occupied';
  tick: number;
}

export interface EntitySeenPayload {
  observer: Entity;
  target: Entity;
  distance: number;
  tick: number;
}

export interface AIModeChangedPayload {
  entity: Entity;
  from: AIMode;
  to: AIMode;
  target?: Entity;
  tick: number;
}

export interface EntityEngagedPayload {
  attacker: Entity;
  defender: Entity;
  tick: number;
}

export interface EntityAttackedPayload {
  attacker: Entity;
  defender: Entity;
  tick: number;
}

export interface EntityDamagedPayload {
  entity: Entity;
  amount: number;
  from: Entity | null;
  hpBefore: number;
  hpAfter: number;
  tick: number;
}

export interface EntityDiedPayload {
  entity: Entity;
  killedBy?: Entity;
  tick: number;
}

export type Event =
  | { type: 'move'; payload: MoveEventPayload }
  | { type: 'blocked_move'; payload: BlockedMovePayload }
  | { type: 'entity_seen'; payload: EntitySeenPayload }
  | { type: 'ai_mode_changed', payload: AIModeChangedPayload }
  | { type: 'entity_engaged', payload: EntityEngagedPayload }
  | { type: 'entity_attacked', payload: EntityAttackedPayload }
  | { type: 'entity_damaged', payload: EntityDamagedPayload }
  | { type: 'entity_died', payload: EntityDiedPayload };
