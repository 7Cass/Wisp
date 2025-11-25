import {Entity} from './entities';

export interface Position {
  x: number;
  y: number;
}

export interface Vision {
  radius: number;
}

export interface Appearance {
  glyph: string;
}

export type RaceId = 'human' | 'dwarf' | 'orc';

export interface Race {
  race: RaceId;
}

export type KindId = 'creature' | 'structure' | 'corpse' | 'item' | 'effect';

export interface Kind {
  kind: KindId;
}

export type AIMode = 'idle' | 'chase' | 'flee' | 'engaged';

export interface AIState {
  mode: AIMode;
  target?: Entity;
}

export type EnemyReaction = 'fight' | 'flight' | 'random';

export interface Behavior {
  reactionToEnemy: EnemyReaction;
}

export interface Health {
  current: number;
  baseHealth: number;
}

export interface Attack {
  baseDamage: number;
}
