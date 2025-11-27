import {StoryEvent} from './storyEvent';
import {runStoryTriggers, StoryTrigger, StoryTriggerContext} from './storyTrigger';
import {StoryState} from './storyState';
import {Rng} from '../random/prng';
import {defaultStoryTriggers} from './storyRegistry';
import {Simulation} from '../simulation';
import {Event} from '../events';
import {AURON_DECAY_PER_TICK} from './triggers/auronDriftTrigger';

export interface StoryEventEmitter {
  emitStoryEvent(event: StoryEvent): void;
}

/**
 * Execution context of StorySystem in one tick.
 *
 */
export interface StoryRuntimeContext extends StoryEventEmitter {
  /**
   * Current simulation tick.
   */
  tick: number;

  /**
   * Deterministic randomness source for the StorySystem.
   */
  rng: Rng;

  /**
   * Accumulated narrative state (StoryState).
   */
  story: StoryState;

  /**
   * Raw engine events from this tick.
   * (movement, combat, deaths, etc.)
   */
  events: readonly Event[];
}

/**
 * Main StorySystem engine.
 *
 * It doesn't know Simulation neither EventBus directly.
 * Only works with StoryRuntimeContext + StoryTriggers.
 */
export class StoryEngine {
  constructor(
    private readonly triggers: readonly StoryTrigger[],
  ) {}

  /**
   * Execute StorySystem for a tick.
   *
   * - Build StoryTriggerContext from StoryRuntimeContext.
   * - Run all triggers
   * - For each StoryEvent created, call ctx.emitStoryEvent().
   */
  runTick(ctx: StoryRuntimeContext): void {
    const triggerContext: StoryTriggerContext = {
      tick: ctx.tick,
      rng: ctx.rng,
      story: ctx.story,
      events: ctx.events,
    };

    const storyEvents = runStoryTriggers(triggerContext, this.triggers);

    for (const event of storyEvents) {
      ctx.emitStoryEvent(event);
    }
  }
}

const storyEngine = new StoryEngine(defaultStoryTriggers);

/**
 * System do StorySystem.
 * Essa é a função que você registra no SimulationRunner via addSystem().
 */
export function storySystem(sim: Simulation): void {
  const ctx: StoryRuntimeContext = {
    tick: sim.world.tick,
    rng: sim.rng,
    story: sim.story,
    events: getEventsForStory(sim),

    emitStoryEvent(event: StoryEvent) {
      sim.events.emit({
        type: 'story_event_created',
        payload: event,
      });
    },
  };

  storyEngine.runTick(ctx);

  // Auron decay when no drift in this tick

  const auron = sim.story.auron;
  if (auron.lastDriftTick !== sim.world.tick) {
    auron.presenceIntensity = Math.max(0, auron.presenceIntensity - AURON_DECAY_PER_TICK);
  }
}

/**
 * Pega os eventos brutos do tick para o StorySystem.
 * Ajuste para o shape real do seu EventBus.
 */
function getEventsForStory(sim: Simulation): readonly Event[] {
  return sim.events.events
}
