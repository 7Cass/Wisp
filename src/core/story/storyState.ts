export interface AuronState {
  /**
   * Global Auron presence intensity.
   * 0 = absent, 1 = max presence (abstract definition).
   */
  presenceIntensity: number;

  /**
   * Last tick where a "drift" was registered.
   * null means that doesn't have registered manifestation
   */
  lastDriftTick: number | null;
}

/**
 * StorySystem root state
 *
 * V1 is minimal:
 *  - nextEventId: reserved to StoryEvents that we'll create later.
 *  - auron: state connect to outer entity Auron.
 *
 *  Future: add aggregated facts, narrative arcs, buffers, etc.
 */
export interface StoryState {
  nextEventId: number;
  auron: AuronState;
}

/**
 * Create initial StorySytem state.
 */
export function createInitialStoryState(): StoryState {
  return {
    nextEventId: 1,
    auron: {
      presenceIntensity: 0,
      lastDriftTick: null,
    },
  };
}
