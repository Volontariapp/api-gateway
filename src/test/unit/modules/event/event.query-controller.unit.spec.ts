import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Metadata } from '@grpc/grpc-js';
import { of } from 'rxjs';
import {
  EVENT_COMMAND_SERVICE_NAME,
  EVENT_QUERY_SERVICE_NAME,
  TAG_COMMAND_SERVICE_NAME,
  TAG_QUERY_SERVICE_NAME,
  type EventQueryServiceClient,
} from '@volontariapp/contracts-nest';
import { createMock } from '@volontariapp/testing';
import type { WithMetadata } from '../../../../common/types/grpc.types.js';
import { EventQueryController } from '../../../../modules/event/controllers/queries/event/event.query-controller.js';
import type { EventParticipantsService } from '../../../../modules/event/services/event-participants.service.js';
import type { EventSocialFilterService } from '../../../../modules/event/services/event-social-filter.service.js';
import { SearchEventsRequestDTO } from '../../../../modules/event/dto/request/index.js';
import { MockServicesClientGrpc } from '../../../helpers/mocks/services-client-grpc.mock.js';
import { PublicFileUrlFactory } from '../../../helpers/factories/public-file-url.factory.js';
import { IdsPageFactory } from '../../../helpers/factories/ids-page.factory.js';

describe('EventQueryController.listEvents (Unit)', () => {
  let eventQuery: jest.Mocked<WithMetadata<EventQueryServiceClient>>;
  let socialFilter: jest.Mocked<EventSocialFilterService>;
  let controller: EventQueryController;
  const metadata = new Metadata();
  const req = { internalMetadata: metadata };
  const emptySearch = { events: [], totalCount: 0, pagination: undefined };

  beforeEach(() => {
    eventQuery = createMock<WithMetadata<EventQueryServiceClient>>();
    socialFilter = createMock<EventSocialFilterService>();
    const participants = createMock<EventParticipantsService>();
    jest.spyOn(participants, 'enrichAll').mockResolvedValue(undefined);
    controller = new EventQueryController(
      new MockServicesClientGrpc({
        [EVENT_QUERY_SERVICE_NAME]: eventQuery,
        [EVENT_COMMAND_SERVICE_NAME]: {},
        [TAG_COMMAND_SERVICE_NAME]: {},
        [TAG_QUERY_SERVICE_NAME]: {},
      }),
      PublicFileUrlFactory.createService(),
      participants,
      socialFilter,
    );
    controller.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should restrict the search to the resolved ids', async () => {
    const ids = IdsPageFactory.createIds(3);
    jest.spyOn(socialFilter, 'resolve').mockResolvedValue({ kind: 'ids', ids });
    const searchSpy = jest.spyOn(eventQuery, 'searchEvents').mockReturnValue(of(emptySearch));

    await controller.listEvents(new SearchEventsRequestDTO(), req);

    expect(searchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ ids, excludedIds: [] }),
      metadata,
    );
  });

  it('should send the resolved exclusions as excludedIds and excludedOrganizerIds', async () => {
    const excludedIds = IdsPageFactory.createIds(2);
    const excludedOrganizerIds = IdsPageFactory.createIds(1, 5);
    jest
      .spyOn(socialFilter, 'resolve')
      .mockResolvedValue({ kind: 'excluded', excludedIds, excludedOrganizerIds });
    const searchSpy = jest.spyOn(eventQuery, 'searchEvents').mockReturnValue(of(emptySearch));

    await controller.listEvents(new SearchEventsRequestDTO(), req);

    expect(searchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ ids: [], excludedIds, excludedOrganizerIds }),
      metadata,
    );
  });

  it('should search without restriction when there is no social filter', async () => {
    jest.spyOn(socialFilter, 'resolve').mockResolvedValue({ kind: 'none' });
    const searchSpy = jest.spyOn(eventQuery, 'searchEvents').mockReturnValue(of(emptySearch));

    await controller.listEvents(new SearchEventsRequestDTO(), req);

    expect(searchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ ids: [], excludedIds: [], excludedOrganizerIds: [] }),
      metadata,
    );
  });

  it('should answer an empty page without calling ms-event when nothing can match', async () => {
    jest.spyOn(socialFilter, 'resolve').mockResolvedValue({ kind: 'empty' });
    const searchSpy = jest.spyOn(eventQuery, 'searchEvents');

    const result = await controller.listEvents(new SearchEventsRequestDTO(), req);

    expect(result.events).toEqual([]);
    expect(searchSpy).not.toHaveBeenCalled();
  });
});
