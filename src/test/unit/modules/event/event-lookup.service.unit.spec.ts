import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Metadata } from '@grpc/grpc-js';
import { of, throwError } from 'rxjs';
import {
  EVENT_QUERY_SERVICE_NAME,
  type EventQueryServiceClient,
  type GetEventsByIdsQuery,
} from '@volontariapp/contracts-nest';
import { GrpcStatus } from '@volontariapp/errors';
import { createMock } from '@volontariapp/testing';
import type { WithMetadata } from '../../../../common/types/grpc.types.js';
import {
  EVENT_LOOKUP_CACHE_SIZE,
  EVENT_LOOKUP_TTL_MS,
  EventLookupService,
} from '../../../../modules/event/services/event-lookup.service.js';
import { MockServicesClientGrpc } from '../../../helpers/mocks/services-client-grpc.mock.js';
import { PublicFileUrlFactory } from '../../../helpers/factories/public-file-url.factory.js';
import { EventFactory } from '../../../helpers/factories/event.factory.js';

describe('EventLookupService (Unit)', () => {
  let eventQuery: jest.Mocked<WithMetadata<EventQueryServiceClient>>;
  let service: EventLookupService;
  const metadata = new Metadata();

  /** ms-event answers in the order of the ids and skips the unknown ones. */
  const answerFor =
    (unknown: readonly string[] = []) =>
    ({ ids }: GetEventsByIdsQuery) => {
      const events = ids
        .filter((id) => !unknown.includes(id))
        .map((id) => EventFactory.createEvent({ id, title: `title-${id}` }));
      return of({ events, totalCount: events.length });
    };

  beforeEach(() => {
    eventQuery = createMock<WithMetadata<EventQueryServiceClient>>();
    service = new EventLookupService(
      new MockServicesClientGrpc({ [EVENT_QUERY_SERVICE_NAME]: eventQuery }),
      PublicFileUrlFactory.createService(),
    );
    service.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should fetch the events on a miss, keyed by id in the order of the ids', async () => {
    const spy = jest.spyOn(eventQuery, 'getEventsByIds').mockImplementation(answerFor());

    const result = await service.getByIds(['b', 'a', 'b', 'c'], metadata);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ ids: ['b', 'a', 'c'] }, metadata);
    expect([...result.keys()]).toEqual(['b', 'a', 'c']);
    expect(result.get('a')?.title).toBe('title-a');
  });

  it('should not call ms-event again for ids read a moment ago', async () => {
    const spy = jest.spyOn(eventQuery, 'getEventsByIds').mockImplementation(answerFor());
    await service.getByIds(['a', 'b'], metadata);

    const result = await service.getByIds(['b', 'a'], metadata);

    expect(spy).toHaveBeenCalledTimes(1);
    expect([...result.keys()]).toEqual(['b', 'a']);
  });

  it('should only ask ms-event for the ids that are not cached and keep the order', async () => {
    const spy = jest.spyOn(eventQuery, 'getEventsByIds').mockImplementation(answerFor());
    await service.getByIds(['b'], metadata);

    const result = await service.getByIds(['a', 'b', 'c'], metadata);

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith({ ids: ['a', 'c'] }, metadata);
    expect([...result.keys()]).toEqual(['a', 'b', 'c']);
  });

  it('should leave an unknown event out and ask for it again next time', async () => {
    const spy = jest.spyOn(eventQuery, 'getEventsByIds').mockImplementation(answerFor(['gone']));

    const first = await service.getByIds(['a', 'gone'], metadata);
    const second = await service.getByIds(['a', 'gone'], metadata);

    expect([...first.keys()]).toEqual(['a']);
    expect([...second.keys()]).toEqual(['a']);
    expect(spy).toHaveBeenLastCalledWith({ ids: ['gone'] }, metadata);
  });

  it('should ask ms-event again once the cached event has expired', async () => {
    const clock = jest.spyOn(Date, 'now').mockReturnValue(50_000);
    const spy = jest.spyOn(eventQuery, 'getEventsByIds').mockImplementation(answerFor());
    await service.getByIds(['a'], metadata);

    clock.mockReturnValue(50_000 + EVENT_LOOKUP_TTL_MS - 1);
    await service.getByIds(['a'], metadata);
    expect(spy).toHaveBeenCalledTimes(1);

    clock.mockReturnValue(50_000 + EVENT_LOOKUP_TTL_MS + 1);
    await service.getByIds(['a'], metadata);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should evict the least recently used event once the capacity is reached', async () => {
    const spy = jest.spyOn(eventQuery, 'getEventsByIds').mockImplementation(answerFor());
    const ids = Array.from({ length: EVENT_LOOKUP_CACHE_SIZE + 1 }, (_, i) => `e-${String(i)}`);
    await service.getByIds(ids, metadata);

    await service.getByIds(['e-0', `e-${String(EVENT_LOOKUP_CACHE_SIZE)}`], metadata);

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith({ ids: ['e-0'] }, metadata);
  });

  it('should return the cached events only and cache nothing when ms-event fails', async () => {
    const spy = jest
      .spyOn(eventQuery, 'getEventsByIds')
      .mockImplementationOnce(answerFor())
      .mockReturnValueOnce(throwError(() => ({ code: GrpcStatus.UNAVAILABLE })))
      .mockImplementation(answerFor());
    await service.getByIds(['a'], metadata);

    const degraded = await service.getByIds(['b', 'a'], metadata);
    const recovered = await service.getByIds(['b', 'a'], metadata);

    expect([...degraded.keys()]).toEqual(['a']);
    expect([...recovered.keys()]).toEqual(['b', 'a']);
    expect(spy).toHaveBeenCalledTimes(3);
    expect(spy).toHaveBeenLastCalledWith({ ids: ['b'] }, metadata);
  });

  it('should hand out a new DTO on every read so a caller cannot alter the cache', async () => {
    jest.spyOn(eventQuery, 'getEventsByIds').mockImplementation(answerFor());
    const first = await service.getByIds(['a'], metadata);
    const firstEvent = first.get('a');
    if (firstEvent !== undefined) firstEvent.title = 'changed';

    const second = await service.getByIds(['a'], metadata);

    expect(second.get('a')?.title).toBe('title-a');
  });

  it('should not call ms-event for an empty list', async () => {
    const spy = jest.spyOn(eventQuery, 'getEventsByIds');

    const result = await service.getByIds([], metadata);

    expect(result.size).toBe(0);
    expect(spy).not.toHaveBeenCalled();
  });
});
