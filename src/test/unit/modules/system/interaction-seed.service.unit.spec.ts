import { jest } from '@jest/globals';
import { Metadata } from '@grpc/grpc-js';
import { Observable } from 'rxjs';
import { EventState } from '@volontariapp/contracts-nest';
import { InteractionSeedService } from '../../../../modules/system/services/interaction-seed.service.js';
import {
  MAX_ATTENDANCE_BATCH_SIZE,
  type AttendanceScenario,
} from '../../../../modules/system/constants/seed-attendance-scenarios.constant.js';
import { createInitialSeedStatus } from '../../../../modules/system/common/index.js';
import {
  SEED_ORGANIZER_ID,
  createSeedUserIds,
  createSeedWorld,
  findPositionForScenario,
} from '../../../helpers/factories/seed-interaction.factory.js';
import {
  SEED_ACTOR_HEADER,
  createSeedClientsMock,
  getActorMetadata,
} from '../../../helpers/mocks/seed-clients.mock.js';

describe('InteractionSeedService (Unit)', () => {
  let clients: ReturnType<typeof createSeedClientsMock>;
  let service: InteractionSeedService;
  const baseMetadata = new Metadata();
  const userIds = createSeedUserIds(60);

  beforeEach(() => {
    clients = createSeedClientsMock();
    service = new InteractionSeedService(clients.socialClient, clients.eventClient);
    service.onModuleInit();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const run = async (world: ReturnType<typeof createSeedWorld>) => {
    await service.seedInteractions(
      userIds,
      new Map<string, string>(),
      world.pastEventIds,
      world.futureEventIds,
      world.eventCategoryMap,
      world.eventOwnerMap,
      world.eventCapacityMap,
      4,
      getActorMetadata,
      baseMetadata,
      world.status,
    );
  };

  const registrationsOf = (eventId: string): string[] =>
    clients.spies.register.mock.calls
      .filter(([request]) => request.eventId === eventId)
      .map(([, md]) => md?.get(SEED_ACTOR_HEADER)[0] as string);

  describe('buildRegistrationPlan', () => {
    it('caps registrations to the event capacity', () => {
      const owners = new Map([['e1', SEED_ORGANIZER_ID]]);
      const capacities = new Map([['e1', 3]]);
      const plan = service.buildRegistrationPlan('e1', 0, userIds, 20, [], owners, capacities);
      expect(plan.userIds).toHaveLength(3);
    });

    it('excludes the organizer even when prioritized and removes duplicates', () => {
      const owners = new Map([['e1', SEED_ORGANIZER_ID]]);
      const capacities = new Map([['e1', 100]]);
      const plan = service.buildRegistrationPlan(
        'e1',
        0,
        userIds,
        59,
        [SEED_ORGANIZER_ID, 'user-2', 'user-2'],
        owners,
        capacities,
      );
      expect(plan.userIds).not.toContain(SEED_ORGANIZER_ID);
      expect(new Set(plan.userIds).size).toBe(plan.userIds.length);
      expect(plan.userIds[0]).toBe('user-2');
    });
  });

  describe('registrations', () => {
    it('never registers the organizer nor exceeds capacity, past and future', async () => {
      const world = createSeedWorld(6, 4, 4);
      await run(world);
      for (const eventId of [...world.pastEventIds, ...world.futureEventIds]) {
        const registered = registrationsOf(eventId);
        expect(registered.length).toBeLessThanOrEqual(4);
        expect(registered).not.toContain(SEED_ORGANIZER_ID);
        expect(new Set(registered).size).toBe(registered.length);
      }
    });

    it('registers sequentially within one event', async () => {
      let inFlight = 0;
      let maxInFlight = 0;
      clients.spies.register.mockImplementation(
        () =>
          new Observable<Record<string, never>>((subscriber) => {
            inFlight++;
            maxInFlight = Math.max(maxInFlight, inFlight);
            setTimeout(() => {
              inFlight--;
              subscriber.next({});
              subscriber.complete();
            }, 1);
          }),
      );
      await run(createSeedWorld(1, 0, 50));
      expect(clients.spies.register.mock.calls.length).toBeGreaterThan(1);
      expect(maxInFlight).toBe(1);
    });

    it('does not check in nor change state for future events', async () => {
      const world = createSeedWorld(0, 5, 50);
      await run(world);
      expect(clients.spies.attendance).not.toHaveBeenCalled();
      expect(clients.spies.changeState).not.toHaveBeenCalled();
    });
  });

  describe('past event lifecycle', () => {
    const worldFor = (scenario: AttendanceScenario) => {
      const position = findPositionForScenario(scenario);
      const world = createSeedWorld(position + 1, 0, 50);
      return { world, eventId: world.pastEventIds[position] };
    };

    const attendanceCallsOf = (eventId: string) =>
      clients.spies.attendance.mock.calls.filter(([request]) => request.eventId === eventId);
    const stateCallsOf = (eventId: string) =>
      clients.spies.changeState.mock.calls.filter(([request]) => request.id === eventId);

    it('checks in as the organizer, then finishes, after the registrations (rewarded)', async () => {
      const { world, eventId } = worldFor('rewarded');
      await run(world);

      const attendance = attendanceCallsOf(eventId);
      const states = stateCallsOf(eventId);
      expect(attendance).toHaveLength(1);
      expect(states).toHaveLength(1);
      expect(states[0][0].newState).toBe(EventState.EVENT_STATE_FINISHED);
      expect(attendance[0][1]?.get(SEED_ACTOR_HEADER)).toEqual([SEED_ORGANIZER_ID]);
      expect(states[0][1]?.get(SEED_ACTOR_HEADER)).toEqual([SEED_ORGANIZER_ID]);

      const registered = registrationsOf(eventId);
      const checked = attendance[0][0].checkedUserIds;
      expect(checked.length).toBeGreaterThanOrEqual(3);
      expect(checked.length).toBeLessThanOrEqual(registered.length);
      for (const id of checked) {
        expect(registered).toContain(id);
      }

      const registrationOrders = clients.spies.register.mock.calls
        .map((call, i) => ({ call, order: clients.spies.register.mock.invocationCallOrder[i] }))
        .filter(({ call }) => call[0].eventId === eventId)
        .map(({ order }) => order);
      const attendanceOrder =
        clients.spies.attendance.mock.invocationCallOrder[
          clients.spies.attendance.mock.calls.findIndex(([request]) => request.eventId === eventId)
        ];
      const stateOrder =
        clients.spies.changeState.mock.invocationCallOrder[
          clients.spies.changeState.mock.calls.findIndex(([request]) => request.id === eventId)
        ];
      expect(Math.max(...registrationOrders)).toBeLessThan(attendanceOrder);
      expect(attendanceOrder).toBeLessThan(stateOrder);
      expect(world.status.finishedEvents.success).toBeGreaterThanOrEqual(1);
      expect(world.status.attendances.success).toBeGreaterThanOrEqual(checked.length);
    });

    it('checks in 1 or 2 users for a small event', async () => {
      const { world, eventId } = worldFor('small');
      await run(world);
      const checked = attendanceCallsOf(eventId)[0][0].checkedUserIds;
      expect(checked.length).toBeGreaterThanOrEqual(1);
      expect(checked.length).toBeLessThanOrEqual(2);
      expect(stateCallsOf(eventId)[0][0].newState).toBe(EventState.EVENT_STATE_FINISHED);
    });

    it.each<AttendanceScenario>(['no-show', 'unchecked'])(
      'finishes without any attendance written (%s)',
      async (scenario) => {
        const { world, eventId } = worldFor(scenario);
        await run(world);
        expect(attendanceCallsOf(eventId)).toHaveLength(0);
        const states = stateCallsOf(eventId);
        expect(states).toHaveLength(1);
        expect(states[0][0].newState).toBe(EventState.EVENT_STATE_FINISHED);
      },
    );

    it('cancels and never calls setEventAttendance (cancelled)', async () => {
      const { world, eventId } = worldFor('cancelled');
      await run(world);
      expect(attendanceCallsOf(eventId)).toHaveLength(0);
      const states = stateCallsOf(eventId);
      expect(states).toHaveLength(1);
      expect(states[0][0].newState).toBe(EventState.EVENT_STATE_CANCELLED);
      expect(world.status.cancelledEvents.success).toBeGreaterThanOrEqual(1);
    });

    it('leaves the event unfinished and counts failures when check-in fails', async () => {
      const { world, eventId } = worldFor('rewarded');
      clients.spies.attendance.mockImplementation(
        () =>
          new Observable<Record<string, never>>((s) => {
            s.error(new Error('boom'));
          }),
      );
      await run(world);
      expect(stateCallsOf(eventId)).toHaveLength(0);
      expect(world.status.attendances.failed).toBeGreaterThan(0);
    });

    it('counts a failed state change', async () => {
      const { world } = worldFor('cancelled');
      clients.spies.changeState.mockImplementation(
        () =>
          new Observable<{ event: undefined }>((s) => {
            s.error(new Error('nope'));
          }),
      );
      await run(world);
      expect(world.status.cancelledEvents.failed).toBeGreaterThanOrEqual(1);
      expect(world.status.cancelledEvents.success).toBe(0);
    });
  });

  describe('closePastEvent batching', () => {
    it('sends at most 500 ids per setEventAttendance call', async () => {
      const registered = createSeedUserIds(1200);
      const status = createInitialSeedStatus();
      const owners = new Map([['e1', SEED_ORGANIZER_ID]]);
      await service.closePastEvent(
        { eventId: 'e1', position: findPositionForScenario('rewarded'), userIds: registered },
        'rewarded',
        registered,
        owners,
        getActorMetadata,
        baseMetadata,
        status,
      );
      const batches = clients.spies.attendance.mock.calls.map(
        ([request]) => request.checkedUserIds,
      );
      expect(batches.length).toBeGreaterThanOrEqual(2);
      for (const batch of batches) {
        expect(batch.length).toBeLessThanOrEqual(MAX_ATTENDANCE_BATCH_SIZE);
      }
      expect(batches[0]).toHaveLength(MAX_ATTENDANCE_BATCH_SIZE);
      const all = batches.flat();
      expect(new Set(all).size).toBe(all.length);
      expect(status.attendances.success).toBe(all.length);
      expect(status.finishedEvents.success).toBe(1);
    });
  });
});
