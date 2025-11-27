import type {Event} from '../../events';
import type {Simulation} from '../../simulation';

import {moveHandler} from './move';
import {blockedMoveHandler} from './blockedMove';
import {entitySeenHandler} from './entitySeen';
import {aiModeChangedHandler} from './aiModeChanged';
import {entityEngagedHandler} from './entityEngaged';
import {entityDiedHandler} from './entityDied';
import {entityAttackedHandler} from './entityAttacked';
import {entityDamagedHandler} from './entityDamaged';
import {storyHandler} from './story';

export type LogHandler = (event: Event, sim: Simulation) => void;

export type LogHandlerMap = Partial<Record<Event['type'], LogHandler>>;

export const logHandlers: LogHandlerMap = {
  move: moveHandler,
  blocked_move: blockedMoveHandler,
  entity_seen: entitySeenHandler,
  ai_mode_changed: aiModeChangedHandler,
  entity_engaged: entityEngagedHandler,
  entity_attacked: entityAttackedHandler,
  entity_damaged: entityDamagedHandler,
  entity_died: entityDiedHandler,
  story_event_created: storyHandler,
};
