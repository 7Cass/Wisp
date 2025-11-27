import {StoryState} from './storyState';
import {StoryEvent} from './storyEvent';
import {Rng} from '../random/prng';
import {Event} from '../events';

/**
 * Context passed to all story triggers.
 *
 * This context is mounted by storySystem (or StoryEngine) at each tick.
 */
export interface StoryTriggerContext {
  /**
   * Current simulation tick.
   */
  tick: number;

  /**
   * Randomness deterministic source for the StorySystem.
   */
  rng: Rng;

  /**
   * Accumulated narrative state.
   */
  story: StoryState;

  /**
   * Raw tick data (e.g: combat, deaths, movement, etc.).
   */
  events: readonly Event[];
}

/**
 * Base abstract class for a story trigger.
 *
 * Each concrete trigger implements:
 *  - id: stable string for debug/log;
 *  - shouldTrigger: decides if trigger in this tick;
 *  - apply: apply effects and generate StoryEvents.
 */
export abstract class StoryTrigger {
  /**
   * Stable trigger identifier (for logs/debug and  tests).
   */
  abstract readonly id: string;

  /**
   * Decide whether this trigger should be evaluated in this tick.
   */
  abstract shouldTrigger(context: StoryTriggerContext): boolean;

  /**
   * Apply effects on StoryState and returns created StoryEvents.
   *
   * Don't emit anything on EventBus directly; this responsibility is
   * for who calls it (e.g: storySystem)
   */
  abstract apply(context: StoryTriggerContext): StoryEvent[];
}

/**
 * Helper function to execute a list of triggers
 * and collect all created StoryEvents
 */
export function runStoryTriggers(
  context: StoryTriggerContext,
  triggers: readonly StoryTrigger[],
): StoryEvent[] {
  const created: StoryEvent[] = [];

  for (const trigger of triggers) {
    if (!trigger.shouldTrigger(context)) continue;

    const events = trigger.apply(context);
    if (events.length === 0) continue;

    created.push(...events);
  }

  return created;
}
