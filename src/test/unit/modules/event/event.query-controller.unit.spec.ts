import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Metadata } from '@grpc/grpc-js';
import { of } from 'rxjs';
import {
  EVENT_COMMAND_SERVICE_NAME,
  EVENT_QUERY_SERVICE_NAME,
  TAG_COMMAND_SERVICE_NAME,
  TAG_QUERY_SERVICE_NAME,
  PARTICIPATION_QUERY_SERVICE_NAME,
  type EventQueryServiceClient,
  type ParticipationQueryServiceClient,
} from '@volontariapp/contracts-nest';
import { createMock } from '@volontariapp/testing';
import type { WithMetadata } from '../../../../common/types/grpc.types.js';
import { EventQueryController } from '../../../../modules/event/controllers/queries/event/event.query-controller.js';
import type { EventParticipantsService } from '../../../../modules/event/services/event-participants.service.js';
import { SearchEventsRequestDTO } from '../../../../modules/event/dto/request/index.js';
import { MockServicesClientGrpc } from '../../../helpers/mocks/services-client-grpc.mock.js';
import { PublicFileUrlFactory } from '../../../helpers/factories/public-file-url.factory.js';
import { IdsPageFactory } from '../../../helpers/factories/ids-page.factory.js';

describe('EventQueryController.listEvents (Unit)', () => {
  let eventQuery: jest.Mocked<WithMetadata<EventQueryServiceClient>>;
  let participationQuery: jest.Mocked<WithMetadata<ParticipationQueryServiceClient>>;
  let controller: EventQueryController;
  const metadata = new Metadata();
  const req = { internalMetadata: metadata };

  beforeEach(() => {
    eventQuery = createMock<WithMetadata<EventQueryServiceClient>>();
    participationQuery = createMock<WithMetadata<ParticipationQueryServiceClient>>();
    const participants = createMock<EventParticipantsService>();
    jest.spyOn(participants, 'enrichAll').mockResolvedValue(undefined);
    controller = new EventQueryController(
      new MockServicesClientGrpc({
        [EVENT_QUERY_SERVICE_NAME]: eventQuery,
        [EVENT_COMMAND_SERVICE_NAME]: {},
        [TAG_COMMAND_SERVICE_NAME]: {},
        [TAG_QUERY_SERVICE_NAME]: {},
      }),
      new MockServicesClientGrpc({ [PARTICIPATION_QUERY_SERVICE_NAME]: participationQuery }),
      PublicFileUrlFactory.createService(),
      participants,
    );
    controller.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should read all the recommended ids page by page and search them together', async () => {
    const recommendedSpy = jest
      .spyOn(participationQuery, 'getRecommendedEventIds')
      .mockImplementation(({ pagination }) =>
        of(IdsPageFactory.createPage(250, pagination?.page ?? 1, pagination?.limit ?? 100)),
      );
    const searchSpy = jest
      .spyOn(eventQuery, 'searchEvents')
      .mockReturnValue(of({ events: [], totalCount: 0, pagination: undefined }));
    const request = Object.assign(new SearchEventsRequestDTO(), { excludeCreatedByMe: true });

    await controller.listEvents(request, req);

    expect(recommendedSpy).toHaveBeenCalledTimes(3);
    expect(recommendedSpy).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ excludeCreatedByMe: true, pagination: { page: 3, limit: 100 } }),
      metadata,
    );
    expect(searchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ ids: IdsPageFactory.createIds(250) }),
      metadata,
    );
  });

  it('should answer an empty page without calling ms-event when no id is recommended', async () => {
    jest
      .spyOn(participationQuery, 'getRecommendedEventIds')
      .mockReturnValue(of({ ids: [], pagination: undefined }));
    const searchSpy = jest.spyOn(eventQuery, 'searchEvents');
    const request = Object.assign(new SearchEventsRequestDTO(), { excludeWishedByMe: true });

    const result = await controller.listEvents(request, req);

    expect(result.events).toEqual([]);
    expect(searchSpy).not.toHaveBeenCalled();
  });
});
