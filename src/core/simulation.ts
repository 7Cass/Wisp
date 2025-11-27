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
import {DEFAULT_WORLD_CONFIG} from './world/config';
import {ProceduralWorldGenerator, WorldGeneratorConfig} from './world/generators/worldGenerator';
import {ValueNoiseHeightMap} from './world/generators/heightMap';
import {ValueNoiseMoistureMap} from './world/generators/moistureMap';
import {ValueNoiseTemperatureMap} from './world/generators/temperatureMap';
import {DefaultTerrainPainter} from './world/generators/terrainPainter';
import {DefaultVegetationPainter} from './world/generators/vegetationPainter';
import {RangeBasedBiomeMap} from './world/biome/biomeMap';
import {canEntityWalkTo} from './world/occupancy';
import {createInitialStoryState, StoryState} from './story/storyState';
import {createRng, Rng} from './random/prng';

export interface Simulation {
  world: WorldGrid,
  viewport: Viewport,
  ecs: ECSState,
  events: EventBus;
  log: LogState;
  story: StoryState;

  rng: Rng;
  chunkManager: ChunkManager;

  focusedEntity: Entity | null;
}

export function createSimulation(): Simulation {
  const seed = 123;
  const rng = createRng(seed);
  const world = createWorld(
    DEFAULT_WORLD_CONFIG.worldWidth,
    DEFAULT_WORLD_CONFIG.worldHeight
  );

  const generatorConfig: WorldGeneratorConfig = {
    seed,
    worldWidth: world.width,
    worldHeight: world.height,
  };

  // HeightMap
  const heightmap = new ValueNoiseHeightMap({
    seed,
    scale: 800,
    octaves: 3,
    persistence: 0.5,
    lacunarity: 2.0,
  });

  // MoistureMap
  const moistureMap = new ValueNoiseMoistureMap({
    seed,
    scale: 500,
    octaves: 3,
    persistence: 0.5,
    lacunarity: 2.1,
  });

  // TemperatureMap
  const temperatureMap = new ValueNoiseTemperatureMap({
    seed,
    worldHeight: world.height,
    scale: 600,
    octaves: 4,
    persistence: 0.55,
    lacunarity: 2.2,
    latitudeWeight: 0.7,
    altitudeWeight: 0.3,
    noiseStrength: 0.22,
  });

  // Biome Map
  const biomeMap = new RangeBasedBiomeMap();

  // Painters
  const terrainPainter = new DefaultTerrainPainter();
  const vegetationPainter = new DefaultVegetationPainter({
    seed,
    noiseScale: 0.35,
    densityThreshold: 0.25
  });

  // Final Generator
  const generator = new ProceduralWorldGenerator(
    generatorConfig,
    heightmap,
    moistureMap,
    temperatureMap,
    biomeMap,
    terrainPainter,
    vegetationPainter
  );

  // Chunk Manager
  const chunkManager = new ChunkManager(world, generator);

  // Viewport
  const viewport = createViewport(world.width, world.height);

  return {
    world,
    viewport,
    ecs: createEmptyECSState(),
    events: new EventBus(),
    log: createLogState(),
    story: createInitialStoryState(),

    rng,
    chunkManager,

    focusedEntity: null,
  }
}

function canSpawnAt(simulation: Simulation, x: number, y: number): boolean {
  const result = canEntityWalkTo(
    simulation,
    null,
    x,
    y
  );
  
  return result.ok;
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

  const maxAttempts = 10;

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
