import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Metadata } from '@grpc/grpc-js';
import { of, throwError } from 'rxjs';
import {
  PARTICIPATION_QUERY_SERVICE_NAME,
  type ParticipationQueryServiceClient,
} from '@volontariapp/contracts-nest';
import { GrpcStatus } from '@volontariapp/errors';
import { createMock } from '@volontariapp/testing';
import type { WithMetadata } from '../../../../common/types/grpc.types.js';
import { EventParticipantsService } from '../../../../modules/event/services/event-participants.service.js';
import { EventDTO } from '../../../../modules/event/dto/common/event.dto.js';
import { MockServicesClientGrpc } from '../../../helpers/mocks/services-client-grpc.mock.js';
import { PublicFileUrlFactory } from '../../../helpers/factories/public-file-url.factory.js';
import { EventFactory } from '../../../helpers/factories/event.factory.js';

describe('EventParticipantsService (Unit)', () => {
  let participationQuery: jest.Mocked<WithMetadata<ParticipationQueryServiceClient>>;
  let service: EventParticipantsService;
  const metadata = new Metadata();
  const urls = PublicFileUrlFactory.createService();

  beforeEach(() => {
    participationQuery = createMock<WithMetadata<ParticipationQueryServiceClient>>();
    service = new EventParticipantsService(
      new MockServicesClientGrpc({ [PARTICIPATION_QUERY_SERVICE_NAME]: participationQuery }),
    );
    service.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should count the participants plus the organizer', async () => {
    const spy = jest
      .spyOn(participationQuery, 'getEventParticipants')
      .mockReturnValue(of({ ids: [], pagination: { total: 4, page: 1, limit: 1, totalPages: 4 } }));
    const event = EventDTO.fromResponse(EventFactory.createEvent(), urls);

    await service.enrich(event, metadata);

    expect(event.currentParticipants).toBe(5);
    expect(spy).toHaveBeenCalledWith(
      { eventId: event.id, pagination: { page: 1, limit: 1 } },
      metadata,
    );
  });

  it('should keep the value from ms-event when ms-social fails', async () => {
    jest
      .spyOn(participationQuery, 'getEventParticipants')
      .mockReturnValue(throwError(() => ({ code: GrpcStatus.UNAVAILABLE })));
    const event = EventDTO.fromResponse(EventFactory.createEvent({ currentParticipants: 2 }), urls);

    await service.enrich(event, metadata);

    expect(event.currentParticipants).toBe(2);
  });
});
