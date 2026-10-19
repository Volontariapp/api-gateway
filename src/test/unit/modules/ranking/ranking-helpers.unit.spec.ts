import { describe, expect, it } from '@jest/globals';
import {
  EventState,
  FeedbackAction,
  RankingListKind,
  RankingReason,
  RankingSource,
} from '@volontariapp/contracts-nest';
import {
  toFeedbackActionGrpc,
  toRankingListKindGrpc,
  toRankingReasonsWeb,
  toRankingSourceWeb,
} from '../../../../modules/ranking/helpers/ranking-wire.helper.js';
import { clampRankingLimit } from '../../../../modules/ranking/helpers/ranking-limit.helper.js';
import { orderByRanking } from '../../../../modules/ranking/helpers/ranking-order.helper.js';
import {
  isEventFull,
  isEventOpen,
} from '../../../../modules/ranking/helpers/ranked-event-filter.helper.js';
import { buildRankedEventsSearchQuery } from '../../../../modules/ranking/helpers/ranking-content-query.helper.js';
import type { EventWindowOnWire } from '../../../../modules/ranking/types/event-state-wire.type.js';
import { RankingFactory } from '../../../helpers/factories/ranking.factory.js';
import {
  RANKED_EVENT_ID_1,
  RANKED_EVENT_ID_2,
  RANKED_EVENT_ID_3,
} from '../../../helpers/constants/ranking-test.constants.js';

const NOW = new Date('2026-10-19T12:00:00.000Z');
const HOUR = 3_600_000;

const window = (overrides: Partial<EventWindowOnWire> = {}): EventWindowOnWire => ({
  state: 'EVENT_STATE_PUBLISHED',
  startAt: new Date(NOW.getTime() + 24 * HOUR),
  endAt: new Date(NOW.getTime() + 26 * HOUR),
  maxParticipants: 10,
  currentParticipants: 1,
  ...overrides,
});

describe('Ranking helpers (Unit)', () => {
  describe('toRankingReasonsWeb', () => {
    it('should map reasons received as names, the form the gRPC client really decodes', () => {
      expect(toRankingReasonsWeb(['RANKING_REASON_NEAR_YOU', 'RANKING_REASON_TRENDING'])).toEqual([
        'NEAR_YOU',
        'TRENDING',
      ]);
    });

    it('should map reasons received as numbers', () => {
      expect(toRankingReasonsWeb([RankingReason.RANKING_REASON_FOLLOWED_AUTHOR])).toEqual([
        'FOLLOWED_AUTHOR',
      ]);
    });

    it('should drop unspecified and unrecognized codes', () => {
      expect(
        toRankingReasonsWeb([
          'RANKING_REASON_UNSPECIFIED',
          RankingReason.UNRECOGNIZED,
          'RANKING_REASON_RECENT',
        ]),
      ).toEqual(['RECENT']);
    });
  });

  describe('toRankingSourceWeb', () => {
    it('should map a source received as a name or a number', () => {
      expect(toRankingSourceWeb('RANKING_SOURCE_COLD_START')).toBe('COLD_START');
      expect(toRankingSourceWeb(RankingSource.RANKING_SOURCE_FULL)).toBe('FULL');
    });

    it('should fall back to STRUCTURAL_ONLY for an unspecified source', () => {
      expect(toRankingSourceWeb('RANKING_SOURCE_UNSPECIFIED')).toBe('STRUCTURAL_ONLY');
    });
  });

  describe('web to gRPC enums', () => {
    it('should map the list kind and the feedback action', () => {
      expect(toRankingListKindGrpc('EVENT')).toBe(RankingListKind.RANKING_LIST_KIND_EVENT);
      expect(toRankingListKindGrpc('POST')).toBe(RankingListKind.RANKING_LIST_KIND_POST);
      expect(toFeedbackActionGrpc('PASS')).toBe(FeedbackAction.FEEDBACK_ACTION_PASS);
    });
  });

  describe('clampRankingLimit', () => {
    it('should default a missing or invalid limit to 20', () => {
      expect(clampRankingLimit(undefined)).toBe(20);
      expect(clampRankingLimit(0)).toBe(20);
      expect(clampRankingLimit(2.5)).toBe(20);
    });

    it('should cap a large limit at 50 and keep a valid one', () => {
      expect(clampRankingLimit(500)).toBe(50);
      expect(clampRankingLimit(12)).toBe(12);
    });
  });

  describe('orderByRanking', () => {
    it('should follow the ranking order and skip the ids without content', () => {
      const items = [
        RankingFactory.createItem({ id: RANKED_EVENT_ID_3, rank: 1 }),
        RankingFactory.createItem({ id: RANKED_EVENT_ID_1, rank: 2 }),
        RankingFactory.createItem({ id: RANKED_EVENT_ID_2, rank: 3 }),
      ];
      const contents = [{ id: RANKED_EVENT_ID_1 }, { id: RANKED_EVENT_ID_3 }];

      const ranked = orderByRanking(items, contents);

      expect(ranked.map(({ content }) => content.id)).toEqual([
        RANKED_EVENT_ID_3,
        RANKED_EVENT_ID_1,
      ]);
      expect(ranked.map(({ item }) => item.rank)).toEqual([1, 2]);
    });
  });

  describe('isEventOpen', () => {
    it('should keep a published event that has not started', () => {
      expect(isEventOpen(window(), NOW)).toBe(true);
      expect(isEventOpen(window({ state: EventState.EVENT_STATE_PUBLISHED }), NOW)).toBe(true);
    });

    it('should drop an event that started, ended or has no start date', () => {
      expect(isEventOpen(window({ startAt: new Date(NOW.getTime() - HOUR) }), NOW)).toBe(false);
      expect(isEventOpen(window({ startAt: NOW }), NOW)).toBe(false);
      expect(isEventOpen(window({ endAt: new Date(NOW.getTime() - HOUR) }), NOW)).toBe(false);
      expect(isEventOpen(window({ startAt: undefined }), NOW)).toBe(false);
    });

    it('should drop an event that is not published, whatever the form of its state', () => {
      expect(isEventOpen(window({ state: 'EVENT_STATE_DRAFT' }), NOW)).toBe(false);
      expect(isEventOpen(window({ state: 'EVENT_STATE_IN_PROGRESS' }), NOW)).toBe(false);
      expect(isEventOpen(window({ state: EventState.EVENT_STATE_FINISHED }), NOW)).toBe(false);
      expect(isEventOpen(window({ state: 'EVENT_STATE_CANCELLED' }), NOW)).toBe(false);
    });
  });

  describe('isEventFull', () => {
    it('should flag an event whose places are all taken', () => {
      expect(isEventFull(window({ maxParticipants: 10, currentParticipants: 10 }))).toBe(true);
      expect(isEventFull(window({ maxParticipants: 10, currentParticipants: 9 }))).toBe(false);
    });

    it('should treat a maximum of 0 as no limit', () => {
      expect(isEventFull(window({ maxParticipants: 0, currentParticipants: 3 }))).toBe(false);
    });
  });

  describe('buildRankedEventsSearchQuery', () => {
    it('should search the page ids with an explicit pagination equal to their number', () => {
      const ids = Array.from({ length: 20 }, (_, i) => `id-${String(i)}`);

      const query = buildRankedEventsSearchQuery(ids);

      expect(query.ids).toEqual(ids);
      expect(query.pagination).toEqual({ page: 1, limit: 20 });
      expect(query.statuses).toEqual([EventState.EVENT_STATE_PUBLISHED]);
    });
  });
});
