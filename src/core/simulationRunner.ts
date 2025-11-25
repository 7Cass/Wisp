import {Simulation} from './simulation';

export type SimulationSystem = (simulation: Simulation) => void;

/**
 * Manage a simulation "tick" by executing a list of system in order
 */
export class SimulationRunner {
  private systems: SimulationSystem[] = [];

  constructor(private readonly simulation: Simulation) {}

  /**
   * Add a system to the simulation runner
   */
  addSystem(system: SimulationSystem): void {
    this.systems.push(system);
  }

  /**
   * Execute a single simulation tick.
   * Call each system, in order, passing the same Simulation instance.
   */
  tick(): void {
    for (const system of this.systems) {
      system(this.simulation);
    }
  }
}
