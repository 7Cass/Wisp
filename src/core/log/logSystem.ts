import {LogHandlerMap, logHandlers} from './handlers';
import type {Simulation} from '../simulation';

/**
 * Log system responsible for:
 *  - read current tick events (simulation.events.events)
 *  - dispatch to correspondent handlers
 *
 */
export class LogSystem {
  constructor(
    private readonly handlers: LogHandlerMap = logHandlers,
  ) {}

  /**
   * Process all events from current tick, calling the registered handlers
   *
   * @param sim Simulation
   */
  process(sim: Simulation): void {
    for (const event of sim.events.events) {
      const handler = this.handlers[event.type];
      if (handler) {
        handler(event, sim);
      }
    }
  }
}
