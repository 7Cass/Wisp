import {Simulation} from '../../core/simulation';
import {SimulationClock} from '../../core/simulationClock';
import {centerViewportOn, moveViewport} from '../../core/world/viewport';
import {focusNext, focusPrevious} from '../../core/ui/focus';

/**
 * Terminal keyboard input controls:
 *  - WASD -> move viewport
 *  - [ / ] -> change focused entity
 *  - f -> center viewport on focused entity
 *  - q or Ctrl+C -> exit
 */
export function setupTerminalInput(
  sim: Simulation,
  clock: SimulationClock,
): void {
  const stdin = process.stdin;

  if (!stdin.isTTY) {
    // Cannot read raw keyboard input (ex: IDE or redirected)
    return;
  }

  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');

  stdin.on('data', (key: string) => {
    // Ctrl+C or q -> exit safely
    if (key === '\u0003' || key === 'q') {
      clock.stop();
      process.exit(0);
    }

    const vp = sim.viewport;
    const world = sim.world;

    switch (key) {
      case 'w':
        moveViewport(vp, 0, -1, world.width, world.height);
        break;
      case 's':
        moveViewport(vp, 0, 1, world.width, world.height);
        break;
      case 'a':
        moveViewport(vp, -1, 0, world.width, world.height);
        break;
      case 'd':
        moveViewport(vp, 1, 0, world.width, world.height);
        break;

      // Change focused entity
      case '[':
        focusPrevious(sim);
        break;
      case ']':
        focusNext(sim);
        break;

      // Move viewport to focused entity
      case 'f':
        const focused = sim.focusedEntity;
        if (focused !== null) {
          const pos = sim.ecs.positions.get(focused);
          if (pos) {
            centerViewportOn(vp, pos.x, pos.y, world.width, world.height);
          }
        }
        break;

      // Stop tick
      case 'p':
        clock.isRunning() ? clock.stop() : clock.start();
        break;

      // Set tick duration 1s, 0.5s and 0.1s
      case '1':
        clock.setTickDuration(1000);
        break;
      case '2':
        clock.setTickDuration(500);
        break;
      case '3':
        clock.setTickDuration(100);
        break;

      // Ignore other keys silently
      default:
        break;
    }
  });
}
