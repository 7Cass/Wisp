import {Entity} from './entities';
import {AIState, Appearance, Attack, Behavior, Health, Kind, Position, Race, Vision} from './components';

export interface ECSState {
  nextEntityId: number;
  positions: Map<Entity, Position>;
  visions: Map<Entity, Vision>;
  appearances: Map<Entity, Appearance>;
  races: Map<Entity, Race>;
  kinds: Map<Entity, Kind>;
  aiStates: Map<Entity, AIState>;
  healths: Map<Entity, Health>;
  attacks: Map<Entity, Attack>;
  behaviors: Map<Entity, Behavior>;
}

export function createEmptyECSState(): ECSState {
  return {
    nextEntityId: 1,
    positions: new Map(),
    visions: new Map(),
    appearances: new Map(),
    races: new Map(),
    kinds: new Map(),
    aiStates: new Map(),
    healths: new Map(),
    attacks: new Map(),
    behaviors: new Map(),
  }
}
