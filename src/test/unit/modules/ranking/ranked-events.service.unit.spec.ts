import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Metadata } from '@grpc/grpc-js';
import { of, throwError } from 'rxjs';
import {
  EVENT_QUERY_SERVICE_NAME,
  EventState,
  PARTICIPATION_QUERY_SERVICE_NAME,
  RANKING_QUERY_SERVICE_NAME,
  RankingReason,
  type EventQueryServiceClient,
  type ParticipationQueryServiceClient,
  type RankingQueryServiceClient,
} from '@volontariapp/contracts-nest';
import { FALLBACK_ACTIVATED } from '@volontariapp/errors-nest';
import { createMock } from '@volontariapp/testing';
import type { WithMetadata } from '../../../../common/types/grpc.types.js';
import { RankedEventsService } from '../../../../modules/ranking/services/ranked-events.service.js';
import { EventParticipantsService } from '../../../../modules/event/services/event-participants.service.js';
import { MockServicesClientGrpc } from '../../../helpers/mocks/services-client-grpc.mock.js';
import { PublicFileUrlFactory } from '../../../helpers/factories/public-file-url.factory.js';
import { EventFactory } from '../../../helpers/factories/event.factory.js';
import { RankingFactory } from '../../../helpers/factories/ranking.factory.js';
import {
  RANKED_EVENT_ID_1,
  RANKED_EVENT_ID_2,
  RANKED_EVENT_ID_3,
} from '../../../helpers/constants/ranking-test.constants.js';

const NOW = new Date('2026-10-19T12:00:00.000Z');
const IN_ONE_DAY = { seconds: Math.floor(NOW.getTime() / 1000) + 86_400, nanos: 0 };
const IN_TWO_DAYS = { seconds: Math.floor(NOW.getTime() / 1000) + 2 * 86_400, nanos: 0 };
const ONE_HOUR_AGO = { seconds: Math.floor(NOW.getTime() / 1000) - 3_600, nanos: 0 };

const futureEvent = (id: string, maxParticipants = 10) =>
  EventFactory.createEvent({ id, startAt: IN_ONE_DAY, endAt: IN_TWO_DAYS, maxParticipants });

describe('RankedEventsService (Unit)', () => {
  let rankingQuery: jest.Mocked<WithMetadata<RankingQueryServiceClient>>;
  let eventQuery: jest.Mocked<WithMetadata<EventQueryServiceClient>>;
  let participationQuery: jest.Mocked<WithMetadata<ParticipationQueryServiceClient>>;
  let service: RankedEventsService;
  const metadata = new Metadata();

  beforeEach(() => {
    rankingQuery = createMock<WithMetadata<RankingQueryServiceClient>>();
    eventQuery = createMock<WithMetadata<EventQueryServiceClient>>();
    participationQuery = createMock<WithMetadata<ParticipationQueryServiceClient>>();
    const participants = new EventParticipantsService(
      new MockServicesClientGrpc({ [PARTICIPATION_QUERY_SERVICE_NAME]: participationQuery }),
    );
    participants.onModuleInit();
    service = new RankedEventsService(
      new MockServicesClientGrpc({ [RANKING_QUERY_SERVICE_NAME]: rankingQuery }),
      new MockServicesClientGrpc({ [EVENT_QUERY_SERVICE_NAME]: eventQuery }),
      PublicFileUrlFactory.createService(),
      participants,
    );
    service.onModuleInit();
    jest
      .spyOn(participationQuery, 'getEventParticipants')
      .mockReturnValue(of({ ids: [], pagination: { total: 0, page: 1, limit: 1, totalPages: 1 } }));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should return the events in ranking order, skip missing ids and add the ranking fields', async () => {
    const page = RankingFactory.createPage(
      [
        RankingFactory.createItem({ id: RANKED_EVENT_ID_2, rank: 1, score: 0.9 }),
        RankingFactory.createItem({ id: RANKED_EVENT_ID_3, rank: 2 }),
        RankingFactory.createItem({
          id: RANKED_EVENT_ID_1,
          rank: 3,
          score: 0.5,
          reasons: [RankingReason.RANKING_REASON_FRIEND_INVOLVED],
        }),
      ],
      { totalCount: 42 },
    );
    jest.spyOn(rankingQuery, 'getRankingEvents').mockReturnValue(of({ page }));
    const searchSpy = jest.spyOn(eventQuery, 'searchEvents').mockReturnValue(
      of({
        events: [futureEvent(RANKED_EVENT_ID_1), futureEvent(RANKED_EVENT_ID_2)],
        totalCount: 2,
      }),
    );

    const result = await service.read({ cursor: '', limit: 20 }, metadata, NOW);

    expect(result.events.map((e) => e.id)).toEqual([RANKED_EVENT_ID_2, RANKED_EVENT_ID_1]);
    expect(result.events[0]?.rankingScore).toBe(0.9);
    expect(result.events[1]?.reasons).toEqual(['FRIEND_INVOLVED']);
    expect(result.totalCount).toBe(42);
    expect(result.ranking).toMatchObject({ source: 'STRUCTURAL_ONLY', hasMore: true });
    const [query, sentMetadata] = searchSpy.mock.calls[0] ?? [];
    expect(query.ids).toEqual([RANKED_EVENT_ID_2, RANKED_EVENT_ID_3, RANKED_EVENT_ID_1]);
    expect(query.pagination).toEqual({ page: 1, limit: 3 });
    expect(sentMetadata).toBe(metadata);
  });

  it('should drop the events that started, are not published or are full', async () => {
    const started = EventFactory.createEvent({ id: RANKED_EVENT_ID_1, startAt: ONE_HOUR_AGO });
    const finished = {
      ...futureEvent(RANKED_EVENT_ID_2),
      state: EventState.EVENT_STATE_FINISHED,
    };
    const full = futureEvent(RANKED_EVENT_ID_3, 1);
    const page = RankingFactory.createPage([
      RankingFactory.createItem({ id: RANKED_EVENT_ID_1, rank: 1 }),
      RankingFactory.createItem({ id: RANKED_EVENT_ID_2, rank: 2 }),
      RankingFactory.createItem({ id: RANKED_EVENT_ID_3, rank: 3 }),
    ]);
    jest.spyOn(rankingQuery, 'getRankingEvents').mockReturnValue(of({ page }));
    jest
      .spyOn(eventQuery, 'searchEvents')
      .mockReturnValue(of({ events: [started, finished, full], totalCount: 3 }));

    const result = await service.read({ cursor: '', limit: 20 }, metadata, NOW);

    // The organizer counts as a participant: 1 place out of 1 is taken.
    expect(result.events).toEqual([]);
    expect(result.ranking.hasMore).toBe(true);
  });

  it('should answer an empty page without calling ms-event', async () => {
    jest
      .spyOn(rankingQuery, 'getRankingEvents')
      .mockReturnValue(of({ page: RankingFactory.createPage([], { hasMore: false }) }));
    const searchSpy = jest.spyOn(eventQuery, 'searchEvents');

    const result = await service.read({ cursor: '', limit: 20 }, metadata, NOW);

    expect(result.events).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(searchSpy).not.toHaveBeenCalled();
  });

  it('should let FALLBACK_ACTIVATED through so the global filter answers 206', async () => {
    const fallback = FALLBACK_ACTIVATED('ranking.compute_user_ranking', 'RANKING_NOT_READY');
    jest.spyOn(rankingQuery, 'getRankingEvents').mockReturnValue(throwError(() => fallback));
    const searchSpy = jest.spyOn(eventQuery, 'searchEvents');

    await expect(service.read({ cursor: '', limit: 20 }, metadata, NOW)).rejects.toBe(fallback);
    expect(searchSpy).not.toHaveBeenCalled();
  });
});
