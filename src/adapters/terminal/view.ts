import {Simulation} from '../../core/simulation';
import {inBounds} from '../../core/math';
import {Race} from '../../core/ecs/components';
import {terrainToChar} from '../../core/tile';
import {Entity} from '../../core/ecs/entities';
import {vegetationToChar} from '../../core/layers/vegetation';

export interface WorldView {
  grid: string[][];
}

export interface HudView {
  tick: number;
  width: number;
  height: number;
  agentCount: number;
}

export interface LogView {
  lines: string[];
}

export interface FullView {
  world: WorldView;
  hud: HudView;
  log: LogView;
  focus: string[];
}

export function buildWorldView(simulation: Simulation): WorldView {
  const { world, viewport, ecs } = simulation;
  const grid: string[][] = [];

  for (let screenY = 0; screenY < viewport.height; screenY++) {
    grid[screenY] = [];

    const worldY = viewport.y + screenY;

    for (let screenX = 0; screenX < viewport.width; screenX++) {
      const worldX = viewport.x + screenX;

      if (inBounds(world, worldX, worldY)) {
        grid[screenY][screenX] = composeTileChar(simulation, worldX, worldY);
      } else {
        // Out of bounds
        grid[screenY][screenX] = 'X';
      }
    }
  }

  return {
    grid,
  }
}

export function buildHudView(simulation: Simulation): HudView {
  return {
    tick: simulation.world.tick,
    height: simulation.world.height,
    width: simulation.world.width,
    agentCount: simulation.ecs.races.size,
  }
}

export function buildLogView(simulation: Simulation, maxLines: number = 10): LogView {
  const lastEntries = simulation.log.entries.slice(-maxLines);
  return {
    lines: lastEntries.map(e => `[${e.tick}] ${e.message}`),
  }
}

export function buildFocusedEntityPanel(simulation: Simulation): string[] {
  const lines: string[] = [];

  const id = simulation.focusedEntity;
  if (id === null) {
    lines.push('Focused: none');
    return lines;
  }

  const { ecs } = simulation;

  const position = ecs.positions.get(id);
  const kind = ecs.kinds.get(id);
  const race = ecs.races.get(id);
  const health = ecs.healths.get(id);
  const attack = ecs.attacks.get(id);
  const behavior = ecs.behaviors.get(id);
  const aiState = ecs.aiStates.get(id);

  lines.push(`Focused: #${id} (${race?.race} - ${kind?.kind})`);

  if (position) {
    lines.push(` Pos: (${position.x},${position.y})`);
  }

  if (health) {
    lines.push(` HP: ${health.current}/${health.baseHealth}`);
  }

  if (attack) {
    lines.push(` Atk: ${attack.baseDamage}`);
  }

  if (behavior) {
    lines.push(` Behavior: ${behavior.reactionToEnemy}`);
  }

  if (aiState) {
    let targetRace: Race;
    if (aiState.target) {
      targetRace = simulation.ecs.races.get(aiState.target);
    }
    lines.push(` AI: ${aiState.mode}${targetRace ? ` -> #${aiState.target} (${targetRace.race})` : ''}`);
  }

  return lines;
}

export function buildFullView(simulation: Simulation, logLines: number = 10): FullView {
  const worldView = buildWorldView(simulation);
  const hudView = buildHudView(simulation);
  const logView = buildLogView(simulation, logLines);
  const focusPanel = buildFocusedEntityPanel(simulation);

  return {
    world: worldView,
    hud: hudView,
    log: logView,
    focus: focusPanel,
  }
}

function composeTileChar(sim: Simulation, x: number, y: number): string {
  // Terrain (base layer)
  let ch = terrainToChar(sim.chunkManager.getTerrainAt(x, y));

  // Vegetation
  const veg = sim.chunkManager.getVegetationAt(x, y);
  const vegChar = vegetationToChar(veg);
  if (vegChar) {
    ch = vegChar;
  }

  // Structures
  // Effects

  // Entities (overwrite)
  const entityHere = getEntity(sim, x, y);
  if (entityHere) {
    const appearance = sim.ecs.appearances.get(entityHere);
    ch = appearance?.glyph ?? '∆';
  }

  return ch;
}

function getEntity(sim: Simulation, x: number, y: number): Entity | null {
  for (const [entity, position] of sim.ecs.positions) {
    if (position.x === x && position.y === y) return entity;
  }

  return null;
}
