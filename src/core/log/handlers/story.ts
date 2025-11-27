import {AuronDriftStoryEvent, StoryEvent} from '../../story/storyEvent';
import {Event} from '../../events';
import {Simulation} from '../../simulation';
import {appendLog} from '../logState';

/**
 * Represents a log entry generated from a StoryEvent
 *
 * This type is isolated from real LogSteal. Later you can:
 *  - adapt it to your LogState format,
 *  - or swap for the official log type.
 */
export interface StoryLogEntry {
  text: string;
  /**
   * Optional category, useful if you want log filters.
   * E.g: "story", "auron", etc.
   */
  category?: string;
}

/**
 * Main handler for story-related events.
 *
 * This follows the same pattern as other handlers (e.g: moveHandler)
 * it receives the raw Event + Simulation and appends to the log.
 */
export function storyHandler(event: Event, simulation: Simulation): void {
  if (event.type !== 'story_event_created') return;

  const storyEvent = event.payload as StoryEvent;
  const entry = storyEventToLogEntry(storyEvent);

  if (!entry) return;

  appendLog(
    simulation.log,
    simulation.world.tick,
    entry.text,
  );
}

/**
 * Converts a StoryEvent into a log entry (or null, if we don't want to log it).
 */
export function storyEventToLogEntry(
  event: StoryEvent
): StoryLogEntry | null {
  switch (event.type) {
    case 'auron_drift':
      return formatAuronDriftLog(event as AuronDriftStoryEvent);

    default:
      return null;
  }
}

/**
 * Canonical messages for "auron_drift" event.
 *
 * The choice is deterministic (base on event.id) to keep replays consistent.
 */
function formatAuronDriftLog(
  event: AuronDriftStoryEvent,
): StoryLogEntry {
  const variants = [
    'O ar pareceu hesitar por um instante. Nada mais aconteceu.',
    'Um silêncio anômalo tomou a região por alguns segundos.',
    'Por um momento, os sons soaram distantes demais deste lugar.',
    'As sombras pareceram tortas, mas voltaram ao normal rápido demais.',
    'Uma sensação de presença passou, sutil, sem deixar explicação.'
  ] as const;

  const index = event.id % variants.length;
  const text = variants[index];

  return {
    text,
    category: 'auron',
  };
}
