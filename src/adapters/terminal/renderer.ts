import {Simulation} from '../../core/simulation';
import {buildFullView} from './view';

export interface TerminalRendererOptions {
  /**
   * If you should clear the terminal before each render
   * Default: true
   */
  clearOnRender?: boolean;

  /**
   * Number of lines to display on log
   * Default: 10
   */
  logLines?: number;
}

/**
 * Terminal stdout adapter
 * Responsible for:
 *  - build the view (via buildFullView)
 *  - write on console (stdout)
 */
export class TerminalRederer {
  private readonly clearOnRender: boolean;
  private readonly logLines: number;

  constructor(options: TerminalRendererOptions = {}) {
    this.clearOnRender = options.clearOnRender ?? true;
    this.logLines = options.logLines ?? 10;
  }

  render(simulation: Simulation): void {
    const { world, hud, log, focus } = buildFullView(simulation, this.logLines);

    if (this.clearOnRender) {
      this.clearScreen();
    }

    // HUD
    console.log(`Tick: ${hud.tick} | Size: ${hud.width}x${hud.height} | Agents: ${hud.agentCount}`);
    console.log('');

    // Focused entity panel
    for (const line of focus) {
      console.log(line);
    }
    console.log('');

    // World
    for (const row of world.grid) {
      console.log(row.join(''));
    }

    console.log('');
    console.log('Log:');
    for (const line of log.lines) {
      console.log(line);
    }
  }

  private clearScreen(): void {
    console.clear();
  }
}
