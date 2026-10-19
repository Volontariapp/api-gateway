import { afterAll, afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals';
import type { ExecutionContext, INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { of } from 'rxjs';
import { AccessTokenGuard } from '@volontariapp/auth';
import {
  EVENT_COMMAND_SERVICE_NAME,
  EVENT_QUERY_SERVICE_NAME,
  PARTICIPATION_QUERY_SERVICE_NAME,
  RANKING_COMMAND_SERVICE_NAME,
  type EventCommandServiceClient,
  type EventQueryServiceClient,
  type ParticipationQueryServiceClient,
  type RankingCommandServiceClient,
} from '@volontariapp/contracts-nest';
import { createMock } from '@volontariapp/testing';
import type { WithMetadata } from '../../../common/types/grpc.types.js';
import { EVENT_PACKAGE, RANKING_PACKAGE, SOCIAL_PACKAGE } from '../../../grpc/grpc-packages.js';
import { EventQueryController } from '../../../modules/event/controllers/queries/event/event.query-controller.js';
import { EventCommandController } from '../../../modules/event/controllers/commands/event/event.command-controller.js';
import { EventParticipantsService } from '../../../modules/event/services/event-participants.service.js';
import { RankingQueryController } from '../../../modules/ranking/controllers/queries/ranking.query-controller.js';
import { RankingCommandController } from '../../../modules/ranking/controllers/commands/ranking.command-controller.js';
import { RankedEventsService } from '../../../modules/ranking/services/ranked-events.service.js';
import { RankedFeedService } from '../../../modules/ranking/services/ranked-feed.service.js';
import { GetRankingEventsResponseDTO } from '../../../modules/ranking/dto/response/get-ranking-events.response.dto.js';
import { GetRankingFeedResponseDTO } from '../../../modules/ranking/dto/response/get-ranking-feed.response.dto.js';
import { PublicFileUrlService } from '../../../modules/storage/public-file-url.service.js';
import { MockServicesClientGrpc } from '../../helpers/mocks/services-client-grpc.mock.js';
import { PublicFileUrlFactory } from '../../helpers/factories/public-file-url.factory.js';
import { EventFactory } from '../../helpers/factories/event.factory.js';
import { createAuthUserMock } from '../../helpers/factories/auth-user.factory.js';
import { RankingFactory } from '../../helpers/factories/ranking.factory.js';
import { RANKED_EVENT_ID_1 } from '../../helpers/constants/ranking-test.constants.js';

/**
 * Non-regression of the routing (06 section 4): the ranking lives under its own prefix because
 * `GET /events/ranking` is captured by `GET /events/:id`. Controllers are registered in the same
 * order as in AppModule (EventModule before RankingModule).
 */
describe('Ranking routes (Integration)', () => {
  let app: INestApplication;
  let server: Server;
  const eventQuery = createMock<WithMetadata<EventQueryServiceClient>>();
  const eventCommand = createMock<WithMetadata<EventCommandServiceClient>>();
  const participationQuery = createMock<WithMetadata<ParticipationQueryServiceClient>>();
  const rankingCommand = createMock<WithMetadata<RankingCommandServiceClient>>();
  const rankedEvents = createMock<RankedEventsService>();
  const rankedFeed = createMock<RankedFeedService>();
  const participants = createMock<EventParticipantsService>();
  const user = createAuthUserMock();
  const emptyPage = RankingFactory.createPage([], { hasMore: false });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [
        EventQueryController,
        EventCommandController,
        RankingQueryController,
        RankingCommandController,
      ],
      providers: [
        {
          provide: EVENT_PACKAGE,
          useValue: new MockServicesClientGrpc({
            [EVENT_QUERY_SERVICE_NAME]: eventQuery,
            [EVENT_COMMAND_SERVICE_NAME]: eventCommand,
          }),
        },
        {
          provide: SOCIAL_PACKAGE,
          useValue: new MockServicesClientGrpc({
            [PARTICIPATION_QUERY_SERVICE_NAME]: participationQuery,
          }),
        },
        {
          provide: RANKING_PACKAGE,
          useValue: new MockServicesClientGrpc({ [RANKING_COMMAND_SERVICE_NAME]: rankingCommand }),
        },
        { provide: PublicFileUrlService, useValue: PublicFileUrlFactory.createService() },
        { provide: EventParticipantsService, useValue: participants },
        { provide: RankedEventsService, useValue: rankedEvents },
        { provide: RankedFeedService, useValue: rankedFeed },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          context.switchToHttp().getRequest<{ user: unknown }>().user = user;
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
    server = app.getHttpServer() as Server;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should route GET /ranking/events to the ranking, not to GET /events/:id', async () => {
    const readSpy = jest
      .spyOn(rankedEvents, 'read')
      .mockResolvedValue(GetRankingEventsResponseDTO.fromPage([], 0, emptyPage));
    const getEventSpy = jest.spyOn(eventQuery, 'getEvent');

    await request(server).get('/ranking/events?limit=5').expect(200);

    expect(readSpy).toHaveBeenCalledTimes(1);
    expect(readSpy.mock.calls[0]?.[0]).toEqual({ cursor: '', limit: 5 });
    expect(getEventSpy).not.toHaveBeenCalled();
  });

  it('should route GET /ranking/feed to the ranked feed', async () => {
    const readSpy = jest
      .spyOn(rankedFeed, 'read')
      .mockResolvedValue(GetRankingFeedResponseDTO.fromPage([], 0, emptyPage));

    await request(server).get('/ranking/feed').expect(200);

    expect(readSpy).toHaveBeenCalledTimes(1);
  });

  it('should still serve GET /events/:id, and capture /events/ranking as an id', async () => {
    const getEventSpy = jest
      .spyOn(eventQuery, 'getEvent')
      .mockReturnValue(of({ event: EventFactory.createEvent({ id: RANKED_EVENT_ID_1 }) }));
    jest.spyOn(participants, 'enrich').mockResolvedValue(undefined);
    const readSpy = jest.spyOn(rankedEvents, 'read');

    await request(server).get(`/events/${RANKED_EVENT_ID_1}`).expect(200);
    await request(server).get('/events/ranking').expect(200);

    expect(getEventSpy.mock.calls.map(([query]) => query.id)).toEqual([
      RANKED_EVENT_ID_1,
      'ranking',
    ]);
    expect(readSpy).not.toHaveBeenCalled();
  });

  it('should route the ranking commands and answer 200', async () => {
    const refreshSpy = jest
      .spyOn(rankingCommand, 'requestRankingRefresh')
      .mockReturnValue(of({ accepted: true, refreshThrottled: false }));
    const locationSpy = jest
      .spyOn(rankingCommand, 'updateUserLocation')
      .mockReturnValue(of({ accepted: true }));
    const feedbackSpy = jest
      .spyOn(rankingCommand, 'recordEventFeedback')
      .mockReturnValue(of({ recorded: 1 }));

    await request(server)
      .post('/ranking/refresh')
      .send({ listKind: 'EVENT' })
      .expect(200, { accepted: true, refreshThrottled: false });
    await request(server)
      .put('/ranking/location')
      .send({ lat: 48.85, lng: 2.35 })
      .expect(200, { accepted: true });
    await request(server)
      .post('/ranking/events/feedback')
      .send({ items: [{ eventId: RANKED_EVENT_ID_1, action: 'PASS' }] })
      .expect(200, { recorded: 1 });

    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(locationSpy).toHaveBeenCalledTimes(1);
    expect(feedbackSpy).toHaveBeenCalledTimes(1);
  });

  it('should reject an invalid body before calling ms-ranking', async () => {
    const refreshSpy = jest.spyOn(rankingCommand, 'requestRankingRefresh');

    await request(server).post('/ranking/refresh').send({ listKind: 'USER' }).expect(400);

    expect(refreshSpy).not.toHaveBeenCalled();
  });
});
