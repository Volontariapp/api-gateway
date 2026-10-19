import {
  type FeedbackAction,
  RankingListKind,
  RankingReason,
  RankingSource,
} from '@volontariapp/contracts-nest';
import type {
  FeedbackActionWeb,
  RankingListKindWeb,
  RankingReasonWeb,
  RankingSourceWeb,
} from '@volontariapp/contracts';
import {
  FEEDBACK_ACTION_TO_GRPC,
  RANKING_FALLBACK_SOURCE,
  RANKING_REASON_TO_WEB,
  RANKING_SOURCE_TO_WEB,
} from '../constants/ranking.constants.js';
import type { RankingReasonOnWire, RankingSourceOnWire } from '../types/ranking-wire.type.js';

/** Unknown codes are dropped: the application only receives codes it can translate. */
export function toRankingReasonsWeb(reasons: readonly RankingReasonOnWire[]): RankingReasonWeb[] {
  return reasons.flatMap((reason) => {
    const value = typeof reason === 'number' ? reason : RankingReason[reason];
    const web = RANKING_REASON_TO_WEB[value];
    return web === undefined ? [] : [web];
  });
}

export function toRankingSourceWeb(source: RankingSourceOnWire): RankingSourceWeb {
  const value = typeof source === 'number' ? source : RankingSource[source];
  return RANKING_SOURCE_TO_WEB[value] ?? RANKING_FALLBACK_SOURCE;
}

export function toRankingListKindGrpc(listKind: RankingListKindWeb): RankingListKind {
  return listKind === 'POST'
    ? RankingListKind.RANKING_LIST_KIND_POST
    : RankingListKind.RANKING_LIST_KIND_EVENT;
}

export function toFeedbackActionGrpc(action: FeedbackActionWeb): FeedbackAction {
  return FEEDBACK_ACTION_TO_GRPC[action];
}
