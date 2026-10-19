import {
  FeedbackAction,
  RankingReason,
  RankingSource,
  type RankingPage,
} from '@volontariapp/contracts-nest';
import type {
  FeedbackActionWeb,
  RankingListKindWeb,
  RankingReasonWeb,
  RankingSourceWeb,
} from '@volontariapp/contracts';

/** Page size when the client sends none (same value as ms-ranking, domain-ranking DEFAULT_PAGE_LIMIT). */
export const RANKING_DEFAULT_LIMIT = 20;

/** Ceiling applied by the gateway: no service bounds the content calls that follow a page. */
export const RANKING_MAX_LIMIT = 50;

/** Largest batch of swipes accepted at once (RANKING_FEEDBACK_MAX_BATCH, decision 32). */
export const RANKING_FEEDBACK_MAX_BATCH = 50;

/** Page size used to read the two block sets of the reader in one call each. */
export const RANKING_BLOCKS_PAGE_LIMIT = 1000;

/** Longest opaque cursor accepted (ms-ranking encodes a short base64url JSON). */
export const RANKING_CURSOR_MAX_LENGTH = 512;

export const RANKING_LIST_KINDS: readonly RankingListKindWeb[] = ['EVENT', 'POST'];

export const RANKING_FEEDBACK_ACTIONS: readonly FeedbackActionWeb[] = ['PASS'];

export const FEEDBACK_ACTION_TO_GRPC: Readonly<Record<FeedbackActionWeb, FeedbackAction>> = {
  PASS: FeedbackAction.FEEDBACK_ACTION_PASS,
};

export const RANKING_SOURCES_WEB: readonly RankingSourceWeb[] = [
  'FULL',
  'STRUCTURAL_ONLY',
  'COLD_START',
];

export const RANKING_REASONS_WEB: readonly RankingReasonWeb[] = [
  'FRIEND_INVOLVED',
  'NEAR_YOU',
  'MATCHES_INTERESTS',
  'STARTING_SOON',
  'TRENDING',
  'FOLLOWED_AUTHOR',
  'FRIEND_AUTHOR',
  'ENGAGED_AUTHOR',
  'LINKED_EVENT_WISHED',
  'LINKED_EVENT_JOINED',
  'RECENT',
];

export const RANKING_REASON_TO_WEB: Readonly<Partial<Record<RankingReason, RankingReasonWeb>>> = {
  [RankingReason.RANKING_REASON_FRIEND_INVOLVED]: 'FRIEND_INVOLVED',
  [RankingReason.RANKING_REASON_NEAR_YOU]: 'NEAR_YOU',
  [RankingReason.RANKING_REASON_MATCHES_INTERESTS]: 'MATCHES_INTERESTS',
  [RankingReason.RANKING_REASON_STARTING_SOON]: 'STARTING_SOON',
  [RankingReason.RANKING_REASON_TRENDING]: 'TRENDING',
  [RankingReason.RANKING_REASON_FOLLOWED_AUTHOR]: 'FOLLOWED_AUTHOR',
  [RankingReason.RANKING_REASON_FRIEND_AUTHOR]: 'FRIEND_AUTHOR',
  [RankingReason.RANKING_REASON_ENGAGED_AUTHOR]: 'ENGAGED_AUTHOR',
  [RankingReason.RANKING_REASON_LINKED_EVENT_WISHED]: 'LINKED_EVENT_WISHED',
  [RankingReason.RANKING_REASON_LINKED_EVENT_JOINED]: 'LINKED_EVENT_JOINED',
  [RankingReason.RANKING_REASON_RECENT]: 'RECENT',
};

export const RANKING_SOURCE_TO_WEB: Readonly<Partial<Record<RankingSource, RankingSourceWeb>>> = {
  [RankingSource.RANKING_SOURCE_FULL]: 'FULL',
  [RankingSource.RANKING_SOURCE_STRUCTURAL_ONLY]: 'STRUCTURAL_ONLY',
  [RankingSource.RANKING_SOURCE_COLD_START]: 'COLD_START',
};

/** Source reported when ms-ranking sends none it knows: the list carries no semantic score. */
export const RANKING_FALLBACK_SOURCE: RankingSourceWeb = 'STRUCTURAL_ONLY';

/** Page used when the gRPC response carries no page at all. */
export const EMPTY_RANKING_PAGE: RankingPage = {
  items: [],
  source: RankingSource.RANKING_SOURCE_UNSPECIFIED,
  computedAt: '',
  listVersion: '',
  nextCursor: '',
  hasMore: false,
  stale: false,
  versionChanged: false,
  totalCount: 0,
};

/** Swagger text of the 206 answered by the ranking reads. */
export const RANKING_FALLBACK_DESCRIPTION =
  'FALLBACK_ACTIVATED: no list yet for this user. A compute job was requested; the body is the error, not a list. Show the normal list and wait for the WebSocket notification';
