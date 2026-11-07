import type { ILiveRevokeRequest } from '@volontariapp/messaging';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

/** Sharing can start this long before `startAt` (04 section 6.2, check 2). */
export const LIVE_SHARING_OPEN_BEFORE_START_MS = 30 * MINUTE_MS;

/** The authorization outlives `endAt` by this long, so the arrival can still be reported. */
export const LIVE_GRANT_GRACE_AFTER_END_MS = 15 * MINUTE_MS;

/** Upper bound of an authorization, whatever the event: ws-service checks it again (D18). */
export const LIVE_GRANT_MAX_DURATION_MS = 8 * HOUR_MS;

/** The call to ws-service is on the request path: it must not hang the gateway. */
export const LIVE_WS_TIMEOUT_MS = 5000;

export type LiveRevokeReason = ILiveRevokeRequest['reason'];

/** Reasons a client may give when it stops sharing. The others are server-side only. */
export const LIVE_REVOKE_REASONS = [
  'ARRIVED',
  'STOPPED',
  'LEFT',
] as const satisfies readonly LiveRevokeReason[];

export const DEFAULT_LIVE_REVOKE_REASON: LiveRevokeReason = 'STOPPED';
