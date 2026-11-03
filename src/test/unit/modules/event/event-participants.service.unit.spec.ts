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

  const buildEvents = (count: number, currentParticipants = 0): EventDTO[] =>
    Array.from({ length: count }, (_, i) =>
      EventDTO.fromResponse(
        EventFactory.createEvent({ id: `event-${String(i)}`, currentParticipants }),
        urls,
      ),
    );

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

  it('should count the participants plus the organizer for a single event', async () => {
    const spy = jest
      .spyOn(participationQuery, 'countEventParticipants')
      .mockReturnValue(of({ counts: [{ eventId: 'event-0', participantCount: 4 }] }));
    const [event] = buildEvents(1);

    await service.enrich(event, metadata);

    expect(event.currentParticipants).toBe(5);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ eventIds: ['event-0'] }, metadata);
  });

  it('should split 250 events into batches of 100, 100 and 50 ids', async () => {
    const spy = jest
      .spyOn(participationQuery, 'countEventParticipants')
      .mockImplementation(({ eventIds }) =>
        of({
          counts: eventIds.map((eventId) => ({ eventId, participantCount: 2 })),
        }),
      );
    const events = buildEvents(250);

    await service.enrichAll(events, metadata);

    expect(spy.mock.calls.map(([query]) => query.eventIds.length)).toEqual([100, 100, 50]);
    expect(events.every((event) => event.currentParticipants === 3)).toBe(true);
  });

  it('should deduplicate ids and update every event sharing an id', async () => {
    const spy = jest
      .spyOn(participationQuery, 'countEventParticipants')
      .mockReturnValue(of({ counts: [{ eventId: 'event-0', participantCount: 1 }] }));
    const events = [...buildEvents(1), ...buildEvents(1)];

    await service.enrichAll(events, metadata);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ eventIds: ['event-0'] }, metadata);
    expect(events.map((event) => event.currentParticipants)).toEqual([2, 2]);
  });

  it('should not call ms-social for an empty list', async () => {
    const spy = jest.spyOn(participationQuery, 'countEventParticipants');

    await service.enrichAll([], metadata);

    expect(spy).not.toHaveBeenCalled();
  });

  it('should keep the value from ms-event when ms-social fails', async () => {
    jest
      .spyOn(participationQuery, 'countEventParticipants')
      .mockReturnValue(throwError(() => ({ code: GrpcStatus.UNAVAILABLE })));
    const [event] = buildEvents(1, 2);

    await service.enrich(event, metadata);

    expect(event.currentParticipants).toBe(2);
  });

  it('should lose nothing when one batch fails: only that batch keeps its ms-event value', async () => {
    jest
      .spyOn(participationQuery, 'countEventParticipants')
      .mockImplementation(({ eventIds }) =>
        eventIds.includes('event-0')
          ? throwError(() => ({ code: GrpcStatus.UNAVAILABLE }))
          : of({ counts: eventIds.map((eventId) => ({ eventId, participantCount: 7 })) }),
      );
    const events = buildEvents(150, 9);

    await service.enrichAll(events, metadata);

    expect(events).toHaveLength(150);
    expect(events.slice(0, 100).every((event) => event.currentParticipants === 9)).toBe(true);
    expect(events.slice(100).every((event) => event.currentParticipants === 8)).toBe(true);
  });
});
