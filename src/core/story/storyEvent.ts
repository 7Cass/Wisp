/**
 * Types of narrative events supported by StorySystem.
 *
 * Future: add heroes, conflicts, etc.
 */
export type StoryEventType =
  | 'auron_drift';

/**
 * Common base for all StoryEvents.
 */
export interface StoryEventBase<TType extends StoryEventType = StoryEventType> {
  id: number;
  type: TType;
  tick: number;
}

/**
 * Narrative event indicating Auron presence manifestation.
 */
export interface AuronDriftStoryEvent extends StoryEventBase<'auron_drift'> {
  /**
   * Variation applied in Auron presence in this event (can be positive).
   */
  intensityDelta: number;
}

/**
 * Union of all concrete StoryEvents.
 */
export type StoryEvent =
  | AuronDriftStoryEvent;
