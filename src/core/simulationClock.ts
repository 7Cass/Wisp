import {clearInterval} from 'node:timers';

export type TickCallback = () => void;

/**
 * Control the simulation loop:
 *  - start/stop
 *  - change speed in runtime
 *  - manual step (1 tick each time)
 */
export class SimulationClock {
  private intervalId: NodeJS.Timeout | null = null;
  private tickDurationMs: number;
  private readonly onTick: TickCallback;
  private _isRunning: boolean = false;

  constructor(tickDurationMs: number, onTick: TickCallback) {
    this.tickDurationMs = tickDurationMs;
    this.onTick = onTick;
  }

  /**
   * Start the simulation loop.
   * If still running, do nothing.
   */
  start(): void {
    if (this._isRunning) return;

    this._isRunning = true;
    this.intervalId = setInterval(() => {
      this.onTick();
    }, this.tickDurationMs);
  }

  /**
   * Stop the loop (don't reset simulation state)
   */
  stop(): void {
    if (!this._isRunning) return;

    this._isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Advance exactly 1 tick, without depending on setInterval.
   * Useful for step-by-step/test mode.
   */
  step(): void {
    this.onTick();
  }

  /**
   * Switch interval between ticks in milliseconds.
   * If the clock is still running, restart setInterval with the new value.
   */
  setTickDuration(ms: number): void {
    if (ms <= 0) {
      throw new Error('tickDuration must be greater than 0');
    }

    this.tickDurationMs = ms;

    if (this._isRunning) {
      // Restart with new interval
      this.stop();
      this.start();
    }
  }

  /**
   * Return the current interval (ms) between ticks.
   */
  getTickDuration(): number {
    return this.tickDurationMs;
  }

  /**
   * Indicate if the clock is running in continuous mode
   */
  isRunning(): boolean {
    return this._isRunning;
  }
}
