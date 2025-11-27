import {StoryTrigger, StoryTriggerContext} from '../storyTrigger';
import {AuronDriftStoryEvent, StoryEvent} from '../storyEvent';

/**
 * Base chance of Auron manifesting in a tick.
 */
const BASE_DRIFT_CHANCE = 0.01;

/**
 * How much Auron intensity grows each drift.
 */
const INTENSITY_DELTA = 0.05;

/**
 * How much Auron presence will decay per tick.
 */
export const AURON_DECAY_PER_TICK = 0.005;

export class AuronDriftTrigger extends StoryTrigger {
  readonly id: string = 'auron.drift';

  shouldTrigger(context: StoryTriggerContext): boolean {
    const roll = context.rng.float();
    return roll < BASE_DRIFT_CHANCE;
  }

  apply(context: StoryTriggerContext): StoryEvent[] {
    const { story, tick } = context;
    const { auron } = story;

    const before = auron.presenceIntensity;
    const after = Math.min(1, before + INTENSITY_DELTA);

    auron.presenceIntensity = after;
    auron.lastDriftTick = tick;

    const event: AuronDriftStoryEvent = {
      id: story.nextEventId++,
      type: 'auron_drift',
      tick,
      intensityDelta: after - before,
    };

    return [event];
  }


}
