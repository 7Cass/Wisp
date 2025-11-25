import type { Event } from '../events';

/**
 * EventBus is a simple collector of events generated during a tick.
 *
 * It doesn't decide anything alone: only keep the events for the system to process (ex: LogSystem)
 */
export class EventBus {
  private _events: Event[] = [];

  constructor(initialEvents?: Event) {
    if (initialEvents) {
      this._events = [...initialEvents];
    }
  }

  /**
   * Emit event to the bus
   */
  emit(event: Event): void {
    this._events.push(event);
  }

  /**
   * Return the events list of the current tick
   * (external readonly; events should be mutable only internally)
   */
  get events(): readonly Event[] {
    return this._events;
  }

  /**
   * Remove all cached events
   * Should be called at the end of a tick.
   */
  clear(): void {
    this._events = [];
  }

  /**
   * Length of cached events
   */
  size(): number {
    return this._events.length;
  }
}
