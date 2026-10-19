import {
  RankingReason,
  RankingSource,
  type GetRankingEventsResponse,
  type RankingItem,
  type RankingPage,
} from '@volontariapp/contracts-nest';
import type {
  RankingItemOnWire,
  RankingPageOnWire,
} from '../../../modules/ranking/types/ranking-wire.type.js';
import { RANKED_EVENT_ID_1 } from '../constants/ranking-test.constants.js';

export class RankingFactory {
  static createItem(overrides: Partial<RankingItem> = {}): RankingItem {
    return {
      id: overrides.id ?? RANKED_EVENT_ID_1,
      score: overrides.score ?? 0.8,
      rank: overrides.rank ?? 1,
      reasons: overrides.reasons ?? [RankingReason.RANKING_REASON_NEAR_YOU],
      structuralScore: overrides.structuralScore ?? 0.8,
      semanticScore: overrides.semanticScore,
    };
  }

  /** Ranking line as the gateway gRPC client decodes it (`enums: String`): reasons are names. */
  static createWireItem(id: string, rank: number, reasons: RankingItemOnWire['reasons']) {
    const item: RankingItemOnWire = { ...RankingFactory.createItem({ id, rank }), reasons };
    return item;
  }

  static createPage(items: RankingItem[], overrides: Partial<RankingPage> = {}): RankingPage {
    return {
      items,
      source: overrides.source ?? RankingSource.RANKING_SOURCE_STRUCTURAL_ONLY,
      computedAt: overrides.computedAt ?? '2026-10-19T08:00:00.000Z',
      listVersion: overrides.listVersion ?? '2026-10-19T08:00:00.000Z',
      nextCursor: overrides.nextCursor ?? 'next-cursor',
      hasMore: overrides.hasMore ?? true,
      stale: overrides.stale ?? false,
      versionChanged: overrides.versionChanged ?? false,
      totalCount: overrides.totalCount ?? 100,
    };
  }

  static createWirePage(items: RankingItemOnWire[], source: RankingPageOnWire['source']) {
    const page: RankingPageOnWire = { ...RankingFactory.createPage([]), items, source };
    return page;
  }

  static createEventsResponse(page: RankingPage | undefined): GetRankingEventsResponse {
    return { page };
  }
}
