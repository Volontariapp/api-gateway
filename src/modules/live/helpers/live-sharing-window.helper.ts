import { EventState } from '@volontariapp/contracts-nest';
import type { EventStateOnWire } from '../../ranking/types/event-state-wire.type.js';
import {
  LIVE_GRANT_GRACE_AFTER_END_MS,
  LIVE_GRANT_MAX_DURATION_MS,
  LIVE_SHARING_OPEN_BEFORE_START_MS,
} from '../constants/live.constants.js';

function toEventState(state: EventStateOnWire): EventState {
  return typeof state === 'number' ? state : EventState[state];
}

/**
 * Only a published or running event can receive a shared position. An allow-list on purpose:
 * CANCELLED and FINISHED are refused, and so are DRAFT, UNSPECIFIED and any state added later.
 */
export function isShareableState(state: EventStateOnWire): boolean {
  const resolved = toEventState(state);
  return (
    resolved === EventState.EVENT_STATE_PUBLISHED || resolved === EventState.EVENT_STATE_IN_PROGRESS
  );
}

/** `now` is inside [startAt minus 30 min, endAt]. */
export function isInsideSharingWindow(startAt: Date, endAt: Date, now: Date): boolean {
  return (
    now.getTime() >= startAt.getTime() - LIVE_SHARING_OPEN_BEFORE_START_MS &&
    now.getTime() <= endAt.getTime()
  );
}

/** min(endAt plus 15 min, now plus 8 h). */
export function computeGrantExpiry(endAt: Date, now: Date): Date {
  return new Date(
    Math.min(
      endAt.getTime() + LIVE_GRANT_GRACE_AFTER_END_MS,
      now.getTime() + LIVE_GRANT_MAX_DURATION_MS,
    ),
  );
}
