import {TerminalRederer} from './adapters/terminal/renderer.js';
import {createSimulation, spawnRandomCreature} from './core/simulation';
import {LogSystem} from './core/log/logSystem';
import {SimulationClock} from './core/simulationClock';
import {SimulationRunner} from './core/simulationRunner';
import {advanceTick} from './core/world/world';
import {perceptionSystem} from './core/ecs/systems/perception';
import {aiDecisionSystem} from './core/ecs/systems/aiDecision';
import {combatSystem} from './core/ecs/systems/combat';
import {movementSystem} from './core/ecs/systems/movement';
import {deathSystem} from './core/ecs/systems/death';
import {ensureFocusedEntity} from './core/ui/focus';
import {setupTerminalInput} from './adapters/terminal/input';

function main() {
  const renderer = new TerminalRederer({
    clearOnRender: true,
    logLines: 10
  });
  const simulation = createSimulation();
  const logSystem = new LogSystem();

  for (let i = 0; i < 100; i++) {
    let rnd = Math.random();

    if (rnd < 0.2) {
      spawnRandomCreature(simulation, 'orc');
    } else if (rnd >= 0.2 && rnd < 0.5) {
      spawnRandomCreature(simulation, 'dwarf');
    } else {
      spawnRandomCreature(simulation, 'human');
    }
  }

  const runner = new SimulationRunner(simulation);

  // Core systems
  runner.addSystem((sim) => advanceTick(sim.world));
  runner.addSystem((sim) => sim.chunkManager.updateSimulationLevels(sim.viewport));

  // Fundamental systems
  runner.addSystem(perceptionSystem);
  runner.addSystem(aiDecisionSystem);
  runner.addSystem(combatSystem);
  runner.addSystem(movementSystem);

  // After action system
  runner.addSystem(deathSystem);

  // Log systems
  runner.addSystem((sim) => logSystem.process(sim));

  // UI Related systems
  runner.addSystem(ensureFocusedEntity);

  /**
   * App level tick
   *  - run runner.tick()
   *  - render current state
   */
  function tick(): void {
    runner.tick();
    renderer.render(simulation);
  }

  const clock = new SimulationClock(500, tick);

  setupTerminalInput(simulation, clock);

  clock.start();
}
main();
