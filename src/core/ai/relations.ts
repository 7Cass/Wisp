import {RaceId} from '../ecs/components';

export type Relation = 'ally' | 'neutral' | 'enemy';

const RELATIONS: Record<RaceId, Partial<Record<RaceId, Relation>>> = {
  human: {
    human: 'ally',
    dwarf: 'ally',
    orc: 'enemy'
  },
  dwarf: {
    human: 'ally',
    dwarf: 'ally',
    orc: 'enemy'
  },
  orc: {
    human: 'enemy',
    dwarf: 'enemy',
    orc: 'ally',
  }
};

export function relationBetween(a: RaceId, b: RaceId): Relation {
  const direct = RELATIONS[a]?.[b];
  if (direct) {
    return direct;
  }

  return 'neutral';
}

export function isEnemy(a: RaceId, b: RaceId): boolean {
  return relationBetween(a, b) === 'enemy';
}

export function isAly(a: RaceId, b: RaceId): boolean {
  return relationBetween(a, b) === 'ally';
}
