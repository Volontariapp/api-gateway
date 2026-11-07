import { jest } from '@jest/globals';
import { Metadata } from '@grpc/grpc-js';
import { EventSeedService } from '../../../../modules/system/services/event-seed.service.js';
import { createInitialSeedStatus } from '../../../../modules/system/common/index.js';
import { ILE_DE_FRANCE_LOCATIONS } from '../../../../modules/system/constants/seed-locations.constant.js';
import {
  LIVE_EVENT_ANCHOR_NAME,
  LIVE_EVENT_RADIUS_KM,
  distanceKm,
} from '../../../../modules/system/constants/seed-live-locations.constant.js';
import { createSeedUserIds } from '../../../helpers/factories/seed-interaction.factory.js';
import {
  LIVE_SEED_NOW,
  LIVE_SEED_NOW_SEC,
  createLiveSeedTagMap,
} from '../../../helpers/factories/live-event-seed.factory.js';
import { getActorMetadata } from '../../../helpers/mocks/seed-clients.mock.js';
import { createEventSeedClientsMock } from '../../../helpers/mocks/event-seed-clients.mock.js';

const MIN = 60;

describe('EventSeedService live events (Unit)', () => {
  let clients: ReturnType<typeof createEventSeedClientsMock>;
  let service: EventSeedService;
  const userIds = createSeedUserIds(10);

  beforeEach(() => {
    clients = createEventSeedClientsMock();
    service = new EventSeedService(
      clients.eventClient,
      clients.socialClient,
      clients.mediaSeedService,
    );
    service.onModuleInit();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const run = (count: number, durationMinutes = 180) =>
    service.seedLiveEvents(
      userIds,
      new Map<string, string>(),
      createLiveSeedTagMap(),
      count,
      durationMinutes,
      false,
      getActorMetadata,
      new Metadata(),
      createInitialSeedStatus().events,
      LIVE_SEED_NOW,
    );

  const requests = () => clients.spies.createEvent.mock.calls.map(([request]) => request);

  it('creates nothing when liveEventCount is 0', async () => {
    const result = await run(0);

    expect(result.liveEventIds).toHaveLength(0);
    expect(clients.spies.createEvent).not.toHaveBeenCalled();
  });

  it('creates a single normal event when liveEventCount is 1', async () => {
    const result = await run(1);

    expect(result.countByProfile).toEqual({ 'ending-soon': 0, full: 0, normal: 1 });
  });

  it('creates one ending-soon and one normal event when liveEventCount is 2', async () => {
    const result = await run(2);

    expect(result.countByProfile).toEqual({ 'ending-soon': 1, full: 0, normal: 1 });
  });

  it('creates one ending-soon, one full and one normal event when liveEventCount is 3', async () => {
    const result = await run(3);

    expect(result.countByProfile).toEqual({ 'ending-soon': 1, full: 1, normal: 1 });
  });

  it('creates one ending-soon, one full and three normal events when liveEventCount is 5', async () => {
    const result = await run(5);

    expect(result.countByProfile).toEqual({ 'ending-soon': 1, full: 1, normal: 3 });
    expect(result.liveEventIds).toHaveLength(5);
  });

  it('ending-soon event starts 30 min ago and ends in 15 to 20 min', async () => {
    await run(5);

    const [request] = requests();
    expect(request.startAt?.seconds).toBe(LIVE_SEED_NOW_SEC - 30 * MIN);
    const endSec = request.endAt?.seconds ?? 0;
    expect(endSec).toBeGreaterThanOrEqual(LIVE_SEED_NOW_SEC + 15 * MIN);
    expect(endSec).toBeLessThanOrEqual(LIVE_SEED_NOW_SEC + 20 * MIN);
  });

  it('full event has maxParticipants 1 and ends after the configured duration', async () => {
    await run(5, 240);

    const request = requests()[1];
    expect(request.maxParticipants).toBe(1);
    expect(request.startAt?.seconds).toBe(LIVE_SEED_NOW_SEC - 30 * MIN);
    expect(request.endAt?.seconds).toBe(LIVE_SEED_NOW_SEC + 240 * MIN);
  });

  it('normal events start 10 to 60 min ago and end after the configured duration', async () => {
    await run(5, 90);

    for (const request of requests().slice(2)) {
      const startSec = request.startAt?.seconds ?? 0;
      expect(startSec).toBeGreaterThanOrEqual(LIVE_SEED_NOW_SEC - 60 * MIN);
      expect(startSec).toBeLessThanOrEqual(LIVE_SEED_NOW_SEC - 10 * MIN);
      expect(request.endAt?.seconds).toBe(LIVE_SEED_NOW_SEC + 90 * MIN);
      expect(request.maxParticipants).toBeGreaterThanOrEqual(1);
    }
  });

  it('uses locations of a single city within the radius', async () => {
    await run(5);

    const names = requests().map((request) => request.localisationName);
    const locations = names.map((name) =>
      ILE_DE_FRANCE_LOCATIONS.find((l) => name === `${l.name}, ${l.postalCode} ${l.city}`),
    );
    const anchor = ILE_DE_FRANCE_LOCATIONS.find((l) => l.name === LIVE_EVENT_ANCHOR_NAME);
    expect(anchor).toBeDefined();
    for (const location of locations) {
      expect(location).toBeDefined();
      expect(location?.city).toBe('Paris');
      if (anchor && location) {
        expect(distanceKm(anchor, location)).toBeLessThanOrEqual(LIVE_EVENT_RADIUS_KM);
      }
    }
  });

  it('never changes the state of live events', async () => {
    await run(5);

    expect(clients.spies.changeState).not.toHaveBeenCalled();
  });

  it('counts created events in the status', async () => {
    const status = createInitialSeedStatus().events;
    await service.seedLiveEvents(
      userIds,
      new Map<string, string>(),
      createLiveSeedTagMap(),
      3,
      180,
      false,
      getActorMetadata,
      new Metadata(),
      status,
      LIVE_SEED_NOW,
    );

    expect(status.success).toBe(3);
    expect(status.failed).toBe(0);
  });
});
