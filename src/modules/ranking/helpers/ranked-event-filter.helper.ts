import { EventState } from '@volontariapp/contracts-nest';
import type { EventStateOnWire, EventWindowOnWire } from '../types/event-state-wire.type.js';

function toEventState(state: EventStateOnWire): EventState {
  return typeof state === 'number' ? state : EventState[state];
}

/**
 * An event can still be shown in the swipe list: published, not started and not ended (decision 6).
 * An event without a start date is not shown, since it cannot be proven to be in the future.
 */
export function isEventOpen(event: EventWindowOnWire, now: Date): boolean {
  if (toEventState(event.state) !== EventState.EVENT_STATE_PUBLISHED) {
    return false;
  }
  if (event.startAt === undefined || event.startAt.getTime() <= now.getTime()) {
    return false;
  }
  return event.endAt === undefined || event.endAt.getTime() > now.getTime();
}

/** Full once every place is taken; a maximum of 0 is treated as no limit. */
export function isEventFull(event: EventWindowOnWire): boolean {
  return event.maxParticipants > 0 && event.currentParticipants >= event.maxParticipants;
}
