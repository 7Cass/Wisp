import {createEmptyECSState, ECSState} from './ecs/state';
import {inBounds} from './math';
import {Entity} from './ecs/entities';
import {EventBus} from './events';
import {createLogState, LogState} from './log/logState';
import {EnemyReaction, RaceId} from './ecs/components';
import {randomInt} from 'node:crypto';
import {isWalkableTerrain} from './tile';
import {createViewport, Viewport} from './world/viewport';
import {ChunkManager} from './world/chunkManager';
import {createWorld, WorldGrid} from './world/world';
import {generateWorldLayout} from './world/worldGenerator';
import {DEFAULT_WORLD_CONFIG} from './world/config';

export interface Simulation {
  world: WorldGrid,
  viewport: Viewport,
  ecs: ECSState,
  events: EventBus;
  log: LogState;

  chunkManager: ChunkManager;

  focusedEntity: Entity | null;
}

export function createSimulation(): Simulation {
  const world = createWorld(
    DEFAULT_WORLD_CONFIG.worldWidth,
    DEFAULT_WORLD_CONFIG.worldHeight
  );
  const chunkManager = new ChunkManager(world);

  generateWorldLayout(world, chunkManager);

  const viewport = createViewport(world.width, world.height);

  return {
    world,
    viewport,
    ecs: createEmptyECSState(),
    events: new EventBus(),
    log: createLogState(),

    chunkManager,

    focusedEntity: null,
  }
}

function canSpawnAt(simulation: Simulation, x: number, y: number): boolean {
  if (!inBounds(simulation.world, x, y)) {
    return false;
  }

  if (!isWalkableTerrain(simulation.chunkManager.getTerrainAt(x, y))) {
    return false;
  }

  for (const position of simulation.ecs.positions.values()) {
    if (position.x === x && position.y === y) {
      return false;
    }
  }

  return true;
}

function spawnCreature(simulation: Simulation, x: number, y: number, race: RaceId, glyph: string): Entity {
  const entity = simulation.ecs.nextEntityId++;

  simulation.ecs.positions.set(entity, { x, y });
  simulation.ecs.kinds.set(entity, { kind: 'creature' });
  simulation.ecs.races.set(entity, { race });
  simulation.ecs.appearances.set(entity, { glyph });
  simulation.ecs.aiStates.set(entity, { mode: 'idle' });

  simulation.chunkManager.addEntity(entity, x, y);

  return entity;
}

export function spawnRandomCreature(simulation: Simulation, race?: RaceId): Entity | null {
  const { width, height } = simulation.world;

  const availableRaces: RaceId[] = ['human', 'dwarf', 'orc'];

  function pickRace(): RaceId {
    if (race) {
      return race;
    }
    const idx = randomInt(0, availableRaces.length);
    return availableRaces[idx];
  }

  const maxAttempts = 500;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const x = randomInt(0, width);
    const y = randomInt(0, height);

    if (!canSpawnAt(simulation, x, y)) {
      continue;
    }

    const chosenRace = pickRace();
    let entity: Entity | null = null;

    switch (chosenRace) {
      case 'human':
        entity = spawnHuman(simulation, x, y);
        break;
      case 'dwarf':
        entity = spawnDwarf(simulation, x, y);
        break;
      case 'orc':
        entity = spawnOrc(simulation, x, y);
        break;
      default:
        entity = null;
        break;
    }

    if (entity !== null) {
      return entity;
    }
  }

  return null;
}

export function spawnHuman(simulation: Simulation, x: number, y: number): Entity | null {
  if (!canSpawnAt(simulation, x, y)) {
    return null;
  }

  const entity = spawnCreature(simulation, x, y, 'human', 'h');

  simulation.ecs.visions.set(entity, { radius: 2 });
  simulation.ecs.healths.set(entity, { current: 100, baseHealth: 100 });
  simulation.ecs.attacks.set(entity, { baseDamage: 2 });

  const roll = Math.random();
  const reactionToEnemy: EnemyReaction = roll < 0.3 ? 'fight' : 'flight';
  simulation.ecs.behaviors.set(entity, { reactionToEnemy });


  return entity;
}

export function spawnDwarf(simulation: Simulation, x: number, y: number): Entity | null {
  if (!canSpawnAt(simulation, x, y)) {
    return null;
  }

  const entity = spawnCreature(simulation, x, y, 'dwarf', 'd');

  simulation.ecs.visions.set(entity, { radius: 2 });
  simulation.ecs.healths.set(entity, { current: 120, baseHealth: 120 });
  simulation.ecs.attacks.set(entity, { baseDamage: 3 });

  const roll = Math.random();
  const reactionToEnemy: EnemyReaction = roll < 0.5 ? 'fight' : 'flight';
  simulation.ecs.behaviors.set(entity, { reactionToEnemy });

  return entity;
}

export function spawnOrc(simulation: Simulation, x: number, y: number): Entity | null {
  if (!canSpawnAt(simulation, x, y)) {
    return null;
  }

  const entity = spawnCreature(simulation, x, y, 'orc', 'o');

  simulation.ecs.visions.set(entity, { radius: 20 });
  simulation.ecs.healths.set(entity, { current: 100, baseHealth: 100 });
  simulation.ecs.attacks.set(entity, { baseDamage: 10 });

  const roll = Math.random();
  const reactionToEnemy: EnemyReaction = roll < 0.8 ? 'fight' : 'flight';
  simulation.ecs.behaviors.set(entity, { reactionToEnemy });

  return entity;
}
