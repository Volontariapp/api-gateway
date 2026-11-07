import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Metadata } from '@grpc/grpc-js';
import { of, throwError } from 'rxjs';
import {
  EVENT_QUERY_SERVICE_NAME,
  EventState,
  PARTICIPATION_QUERY_SERVICE_NAME,
  type EventQueryServiceClient,
  type ParticipationQueryServiceClient,
} from '@volontariapp/contracts-nest';
import { EVENT_NOT_FOUND, INVALID_PARAMETER } from '@volontariapp/errors-nest';
import { Logger } from '@volontariapp/logger';
import { createMock } from '@volontariapp/testing';
import type { WithMetadata } from '../../../../common/types/grpc.types.js';
import { LiveSharingService } from '../../../../modules/live/services/live-sharing.service.js';
import type { LiveWsClient } from '../../../../modules/live/services/live-ws.client.js';
import { MockServicesClientGrpc } from '../../../helpers/mocks/services-client-grpc.mock.js';
import { setupVolontariappLoggerMock } from '../../../helpers/mocks/volontariapp-logger.mock.js';
import { createLiveWsClientMock } from '../../../helpers/mocks/live-ws-client.mock.js';
import { createAuthUserMock } from '../../../helpers/factories/auth-user.factory.js';
import { IdsPageFactory } from '../../../helpers/factories/ids-page.factory.js';
import {
  LIVE_CALLER_ID,
  LIVE_EVENT_ID,
  LIVE_EVENT_LATITUDE,
  LIVE_EVENT_LONGITUDE,
  LIVE_NOW,
  LIVE_ORGANIZER_ID,
  LiveSharingFactory,
} from '../../../helpers/factories/live-sharing.factory.js';

describe('LiveSharingService (Unit)', () => {
  let eventQuery: jest.Mocked<WithMetadata<EventQueryServiceClient>>;
  let participationQuery: jest.Mocked<WithMetadata<ParticipationQueryServiceClient>>;
  let wsClient: jest.Mocked<LiveWsClient>;
  let grantSpy: jest.SpiedFunction<LiveWsClient['grant']>;
  let revokeSpy: jest.SpiedFunction<LiveWsClient['revoke']>;
  let service: LiveSharingService;
  const caller = createAuthUserMock({ id: LIVE_CALLER_ID });
  const metadata = new Metadata();

  const respondWith = (event: ReturnType<typeof LiveSharingFactory.createEvent>) =>
    jest.spyOn(eventQuery, 'getEvent').mockReturnValue(of({ event }));
  const participateIn = (ids: string[]) =>
    jest
      .spyOn(participationQuery, 'getUserParticipateEvent')
      .mockReturnValue(of({ ids, pagination: undefined }));

  /** The error every refusal of authorization must be. */
  const denied = () => EVENT_NOT_FOUND(LIVE_EVENT_ID);
  const caught = async (promise: Promise<unknown>): Promise<unknown> => {
    try {
      await promise;
    } catch (error: unknown) {
      return error;
    }
    throw new Error('Expected the call to be refused');
  };

  beforeEach(() => {
    setupVolontariappLoggerMock();
    jest.useFakeTimers({
      now: LIVE_NOW,
      doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'],
    });
    eventQuery = createMock<WithMetadata<EventQueryServiceClient>>();
    participationQuery = createMock<WithMetadata<ParticipationQueryServiceClient>>();
    wsClient = createLiveWsClientMock();
    grantSpy = jest.spyOn(wsClient, 'grant');
    revokeSpy = jest.spyOn(wsClient, 'revoke');
    service = new LiveSharingService(
      new MockServicesClientGrpc({ [EVENT_QUERY_SERVICE_NAME]: eventQuery }),
      new MockServicesClientGrpc({ [PARTICIPATION_QUERY_SERVICE_NAME]: participationQuery }),
      wsClient,
    );
    service.onModuleInit();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('grant: refusals', () => {
    it.each([
      ['CANCELLED', EventState.EVENT_STATE_CANCELLED],
      ['FINISHED', EventState.EVENT_STATE_FINISHED],
      ['DRAFT', EventState.EVENT_STATE_DRAFT],
      ['UNSPECIFIED', EventState.EVENT_STATE_UNSPECIFIED],
    ])('should refuse an event in the %s state with the common answer', async (_name, state) => {
      respondWith(LiveSharingFactory.createEvent({ state }));
      const participationSpy = participateIn([LIVE_EVENT_ID]);

      const error = await caught(service.grant(caller, LIVE_EVENT_ID, metadata));

      expect(error).toEqual(denied());
      expect(participationSpy).not.toHaveBeenCalled();
      expect(grantSpy).not.toHaveBeenCalled();
    });

    it('should read the state under the name the gRPC client really decodes (enums: String)', async () => {
      participateIn([LIVE_EVENT_ID]);
      respondWith(
        Object.assign(LiveSharingFactory.createEvent(), { state: 'EVENT_STATE_CANCELLED' }),
      );
      await expect(service.grant(caller, LIVE_EVENT_ID, metadata)).rejects.toEqual(denied());
      expect(grantSpy).not.toHaveBeenCalled();

      respondWith(
        Object.assign(LiveSharingFactory.createEvent(), { state: 'EVENT_STATE_IN_PROGRESS' }),
      );
      await expect(service.grant(caller, LIVE_EVENT_ID, metadata)).resolves.toBeUndefined();
      expect(grantSpy).toHaveBeenCalledTimes(1);
    });

    it('should refuse before the window opens, 30 minutes before the start', async () => {
      respondWith(LiveSharingFactory.createEvent({ startInMinutes: 31, endInMinutes: 120 }));
      const participationSpy = participateIn([LIVE_EVENT_ID]);

      await expect(service.grant(caller, LIVE_EVENT_ID, metadata)).rejects.toEqual(denied());
      expect(participationSpy).not.toHaveBeenCalled();
      expect(grantSpy).not.toHaveBeenCalled();
    });

    it('should refuse after the end of the event', async () => {
      respondWith(LiveSharingFactory.createEvent({ startInMinutes: -120, endInMinutes: -1 }));
      const participationSpy = participateIn([LIVE_EVENT_ID]);

      await expect(service.grant(caller, LIVE_EVENT_ID, metadata)).rejects.toEqual(denied());
      expect(participationSpy).not.toHaveBeenCalled();
      expect(grantSpy).not.toHaveBeenCalled();
    });

    it('should accept exactly 30 minutes before the start and exactly at the end', async () => {
      participateIn([LIVE_EVENT_ID]);
      respondWith(LiveSharingFactory.createEvent({ startInMinutes: 30, endInMinutes: 60 }));
      await expect(service.grant(caller, LIVE_EVENT_ID, metadata)).resolves.toBeUndefined();

      respondWith(LiveSharingFactory.createEvent({ startInMinutes: -60, endInMinutes: 0 }));
      await expect(service.grant(caller, LIVE_EVENT_ID, metadata)).resolves.toBeUndefined();
      expect(grantSpy).toHaveBeenCalledTimes(2);
    });

    it('should refuse an event without location, dates or organizer', async () => {
      participateIn([LIVE_EVENT_ID]);
      const incomplete = [
        { ...LiveSharingFactory.createEvent(), location: undefined },
        { ...LiveSharingFactory.createEvent(), startAt: undefined },
        { ...LiveSharingFactory.createEvent(), endAt: undefined },
        LiveSharingFactory.createEvent({ organizerId: '' }),
        { ...LiveSharingFactory.createEvent(), organizerId: undefined },
      ];
      for (const event of incomplete) {
        respondWith(event);
        await expect(service.grant(caller, LIVE_EVENT_ID, metadata)).rejects.toEqual(denied());
      }
      expect(grantSpy).not.toHaveBeenCalled();
    });

    it('should refuse the organizer with a 400, before reading the participations', async () => {
      respondWith(LiveSharingFactory.createEvent({ organizerId: LIVE_CALLER_ID }));
      const participationSpy = participateIn([LIVE_EVENT_ID]);

      const error = await caught(service.grant(caller, LIVE_EVENT_ID, metadata));

      expect(error).toMatchObject({ statusCode: 400, code: INVALID_PARAMETER('eventId').code });
      expect(participationSpy).not.toHaveBeenCalled();
      expect(grantSpy).not.toHaveBeenCalled();
    });

    it('should refuse a caller who does not take part in the event', async () => {
      respondWith(LiveSharingFactory.createEvent());
      participateIn(IdsPageFactory.createIds(3));

      await expect(service.grant(caller, LIVE_EVENT_ID, metadata)).rejects.toEqual(denied());
      expect(grantSpy).not.toHaveBeenCalled();
    });

    it('should answer an unknown event exactly like a caller who does not participate', async () => {
      respondWith(LiveSharingFactory.createEvent());
      participateIn([]);
      const notParticipant = await caught(service.grant(caller, LIVE_EVENT_ID, metadata));

      jest.spyOn(eventQuery, 'getEvent').mockReturnValue(
        throwError(() => ({
          code: 5,
          details: JSON.stringify({ statusCode: 404, code: 'NOT_FOUND', message: 'Event gone' }),
          message: '5 NOT_FOUND: Event gone',
        })),
      );
      const unknownEvent = await caught(service.grant(caller, LIVE_EVENT_ID, metadata));

      expect(unknownEvent).toEqual(notParticipant);
      expect(unknownEvent).toMatchObject({ statusCode: 404, message: denied().message });
      expect(grantSpy).not.toHaveBeenCalled();
    });

    it('should answer an event ms-event returns empty like an unknown event', async () => {
      jest.spyOn(eventQuery, 'getEvent').mockReturnValue(of({ event: undefined }));

      await expect(service.grant(caller, LIVE_EVENT_ID, metadata)).rejects.toEqual(denied());
    });

    it('should not turn another failure of ms-event into a refusal', async () => {
      const unavailable = { code: 14, details: 'ms-event down', message: '14 UNAVAILABLE' };
      jest.spyOn(eventQuery, 'getEvent').mockReturnValue(throwError(() => unavailable));

      await expect(service.grant(caller, LIVE_EVENT_ID, metadata)).rejects.toBe(unavailable);
      expect(grantSpy).not.toHaveBeenCalled();
    });
  });

  describe('grant: success', () => {
    it('should read the event and the participations of the caller with the internal metadata', async () => {
      const eventSpy = respondWith(LiveSharingFactory.createEvent());
      const participationSpy = participateIn([LIVE_EVENT_ID]);

      await service.grant(caller, LIVE_EVENT_ID, metadata);

      expect(eventSpy).toHaveBeenCalledWith({ id: LIVE_EVENT_ID }, metadata);
      expect(participationSpy).toHaveBeenCalledWith(
        { pagination: { page: 1, limit: 100 } },
        metadata,
      );
    });

    it('should find the event on a later page of the participations', async () => {
      respondWith(LiveSharingFactory.createEvent());
      const participationSpy = jest
        .spyOn(participationQuery, 'getUserParticipateEvent')
        .mockImplementation(({ pagination }) =>
          of(
            pagination?.page === 2
              ? { ids: [LIVE_EVENT_ID], pagination: undefined }
              : { ids: IdsPageFactory.createIds(100), pagination: undefined },
          ),
        );

      await service.grant(caller, LIVE_EVENT_ID, metadata);

      expect(participationSpy).toHaveBeenCalledTimes(2);
      expect(grantSpy).toHaveBeenCalledTimes(1);
    });

    it('should send ws-service the grant built from the event, ending 15 minutes after it', async () => {
      respondWith(LiveSharingFactory.createEvent({ startInMinutes: -30, endInMinutes: 90 }));
      participateIn([LIVE_EVENT_ID]);

      await service.grant(caller, LIVE_EVENT_ID, metadata);

      expect(grantSpy).toHaveBeenCalledTimes(1);
      expect(grantSpy).toHaveBeenCalledWith(caller, {
        eventId: LIVE_EVENT_ID,
        organizerId: LIVE_ORGANIZER_ID,
        eventLatitude: LIVE_EVENT_LATITUDE,
        eventLongitude: LIVE_EVENT_LONGITUDE,
        expiresAt: LiveSharingFactory.at(105).toISOString(),
      });
    });

    it('should cap the authorization at 8 hours when the event ends later', async () => {
      respondWith(LiveSharingFactory.createEvent({ startInMinutes: -30, endInMinutes: 24 * 60 }));
      participateIn([LIVE_EVENT_ID]);

      await service.grant(caller, LIVE_EVENT_ID, metadata);

      expect(grantSpy).toHaveBeenCalledWith(
        caller,
        expect.objectContaining({ expiresAt: LiveSharingFactory.at(8 * 60).toISOString() }),
      );
    });

    it('should take the organizer of the event, whoever the caller is', async () => {
      const otherOrganizer = '423e4567-e89b-42d3-a456-426614174000';
      respondWith(LiveSharingFactory.createEvent({ organizerId: otherOrganizer }));
      participateIn([LIVE_EVENT_ID]);

      await service.grant(caller, LIVE_EVENT_ID, metadata);

      expect(grantSpy).toHaveBeenCalledWith(
        caller,
        expect.objectContaining({ organizerId: otherOrganizer }),
      );
    });

    it('should accept a published event as well as a running one', async () => {
      respondWith(LiveSharingFactory.createEvent({ state: EventState.EVENT_STATE_PUBLISHED }));
      participateIn([LIVE_EVENT_ID]);

      await expect(service.grant(caller, LIVE_EVENT_ID, metadata)).resolves.toBeUndefined();
    });
  });

  describe('revoke', () => {
    it('should pass the caller, the event and the reason to ws-service', async () => {
      await service.revoke(caller, LIVE_EVENT_ID, 'ARRIVED');

      expect(revokeSpy).toHaveBeenCalledWith(caller, LIVE_EVENT_ID, 'ARRIVED');
    });
  });

  describe('logs', () => {
    it('should log identifiers and never a coordinate, on success and on refusal', async () => {
      const logged: string[] = [];
      const record = (...args: unknown[]) => {
        logged.push(args.map((arg) => JSON.stringify(arg)).join(' '));
      };
      jest.spyOn(Logger.prototype, 'log').mockImplementation(record);
      jest.spyOn(Logger.prototype, 'warn').mockImplementation(record);
      jest.spyOn(Logger.prototype, 'error').mockImplementation(record);

      respondWith(LiveSharingFactory.createEvent());
      participateIn([LIVE_EVENT_ID]);
      await service.grant(caller, LIVE_EVENT_ID, metadata);
      participateIn([]);
      await caught(service.grant(caller, LIVE_EVENT_ID, metadata));
      await service.revoke(caller, LIVE_EVENT_ID, 'LEFT');

      const output = logged.join('\n');
      expect(output).toContain(LIVE_EVENT_ID);
      expect(output).toContain(LIVE_CALLER_ID);
      expect(output).toContain('LEFT');
      expect(output).not.toContain(String(LIVE_EVENT_LATITUDE));
      expect(output).not.toContain(String(LIVE_EVENT_LONGITUDE));
    });
  });
});
