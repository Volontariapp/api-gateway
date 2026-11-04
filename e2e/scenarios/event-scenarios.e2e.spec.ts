import { randomUUID } from 'node:crypto';
import type { EventWebResponse, ListEventsWebResponse } from '@volontariapp/contracts';
import { EventState } from '@volontariapp/contracts-nest';
import { UserRoles } from '@volontariapp/shared';
import { waitForSocketEvent } from '../helpers/ws-client.helper.js';
import {
  waitForSocialEventNode,
  waitForSocialEventNodeRemoved,
  waitForSocialIdsToContain,
} from '../helpers/social-node.helper.js';
import { areaQuery, createSuiteGeo } from '../event/event-search.helper.js';
import { createEventRequestFactory } from '../event/event-test.factory.js';
import type { ScenarioActor } from './helpers/scenario-world.helper.js';
import { ScenarioWorld } from './helpers/scenario-world.helper.js';
import { readSocialIds, waitForSocialIdsToExclude } from './helpers/social-graph.helper.js';
import { WS_EVENTS } from './helpers/ws-events.js';

interface EventDeletedWsPayload {
  eventId: string;
}

interface EventIdsBody {
  events: { id: string }[];
}

const SCENARIO_TIMEOUT_MS = 120_000;
/** A completed deletion gather notifies within seconds; kept below SCENARIO_TIMEOUT_MS. */
const EVENT_DELETED_WS_TIMEOUT_MS = 30_000;
const CONCURRENT_PARTICIPANTS = 3;

/**
 * Event domain scenarios (catalogue: e2e/scenarios/README.md). Needs outbox-event (lot 2).
 *   event.created: POST /events -> ms-event (event_queue, stream event:created) -> outbox-event
 *     -> post-processor-social (node + CREATED link) and post-processor-ranking; ws-service opens
 *     the EVENT_CREATION gather, which also waits for EVENT_GEOCODED (post-processor-event).
 *   event.deleted: DELETE /events/:id -> ms-event (hard delete + event_queue, stream event:deleted)
 *     -> outbox-event -> post-processor-social (DETACH DELETE); ws-service opens EVENT_DELETION.
 *   event.finished: PATCH /events/:id/state FINISHED -> ms-event (event_queue, event:finished)
 *     -> post-processor-ranking, post-processor-user (impact score, badges).
 */
describe('Scenarios: events (E2E)', () => {
  let world: ScenarioWorld;
  const geo = createSuiteGeo();

  beforeAll(async () => {
    world = await ScenarioWorld.open();
  });

  afterAll(async () => {
    await world.close();
  });

  const createEvent = async (
    organizer: ScenarioActor,
    idempotencyKey: string = randomUUID(),
  ): Promise<string> => {
    const res = await organizer.client
      .post('/api/v1/events')
      .send(createEventRequestFactory({ idempotencyKey }))
      .expect(201);
    const eventId = (res.body as EventWebResponse).event.id;
    world.onClose(() => organizer.client.delete(`/api/v1/events/${eventId}`));
    return eventId;
  };

  const changeState = (organizer: ScenarioActor, eventId: string, newState: EventState) =>
    organizer.client.patch(`/api/v1/events/${eventId}/state`).send({ newState });

  const publishAt = async (
    organizer: ScenarioActor,
    eventId: string,
    point: { lat: number; lng: number },
  ): Promise<void> => {
    await changeState(organizer, eventId, EventState.EVENT_STATE_PUBLISHED).expect(200);
    await organizer.client
      .patch(`/api/v1/events/${eventId}`)
      .send({ latitude: point.lat, longitude: point.lng })
      .expect(200);
  };

  const searchIds = async (reader: ScenarioActor, query: string): Promise<string[]> => {
    const res = await reader.client.get(`/api/v1/events?${query}&limit=50`).expect(200);
    return (res.body as ListEventsWebResponse).events.map((event) => event.id);
  };

  const myEventIds = async (actor: ScenarioActor, list: 'participated' | 'created') => {
    const res = await actor.client.get(`/api/v1/events/${list}/me`).expect(200);
    return (res.body as EventIdsBody).events.map((event) => event.id);
  };

  describe('needs outbox-event (lot 2)', () => {
    it(
      'an organizer publishes a geolocated event that volunteers find around it and join',
      async () => {
        const organizer = await world.signUp(UserRoles.ORGANIZATION);
        const volunteer = await world.signUp();
        const eventId = await createEvent(organizer);

        const created = await volunteer.client.get(`/api/v1/events/${eventId}`).expect(200);
        expect((created.body as EventWebResponse).event.id).toBe(eventId);

        await publishAt(organizer, eventId, geo.paris);
        const located = (
          (await volunteer.client.get(`/api/v1/events/${eventId}`).expect(200))
            .body as EventWebResponse
        ).event;
        expect(String(located.state)).toContain('PUBLISHED');
        expect(located.location?.latitude).toBeCloseTo(geo.paris.lat, 4);
        expect(located.location?.longitude).toBeCloseTo(geo.paris.lng, 4);
        expect(await searchIds(volunteer, areaQuery(geo.paris))).toContain(eventId);
        expect(await searchIds(volunteer, areaQuery(geo.marseille))).not.toContain(eventId);

        // Social graph comes from event.created through the pipeline, never from the test.
        await waitForSocialEventNode(world.admin, eventId);
        await waitForSocialIdsToContain(
          world.admin,
          `/api/v1/social/users/${organizer.id}/events/created`,
          eventId,
          `CREATED link from organizer ${organizer.id} to event ${eventId}`,
        );

        await volunteer.client.post(`/api/v1/social/events/${eventId}/participate`).expect(201);
        expect(await myEventIds(volunteer, 'participated')).toContain(eventId);
        expect(
          await readSocialIds(world.admin, `/api/v1/social/events/${eventId}/participants`),
        ).toContain(volunteer.id);
      },
      SCENARIO_TIMEOUT_MS,
    );

    it(
      'creating twice with the same idempotency key yields one event and one social node',
      async () => {
        const organizer = await world.signUp(UserRoles.ORGANIZATION);
        const key = randomUUID();

        const [first, second] = await Promise.all([
          createEvent(organizer, key),
          createEvent(organizer, key),
        ]);

        expect(second).toBe(first);
        await waitForSocialIdsToContain(
          world.admin,
          `/api/v1/social/users/${organizer.id}/events/created`,
          first,
          `CREATED link of the idempotent event ${first}`,
        );
        const createdIds = await readSocialIds(
          world.admin,
          `/api/v1/social/users/${organizer.id}/events/created`,
        );
        expect(createdIds.filter((id) => id === first)).toHaveLength(1);
      },
      SCENARIO_TIMEOUT_MS,
    );

    it(
      'concurrent participations are all recorded, each volunteer only sees its own',
      async () => {
        const organizer = await world.signUp(UserRoles.ORGANIZATION);
        const volunteers = await world.signUpMany(CONCURRENT_PARTICIPANTS);
        const outsider = await world.signUp();
        const eventId = await createEvent(organizer);
        await publishAt(organizer, eventId, geo.lyon);
        await waitForSocialEventNode(world.admin, eventId);

        await Promise.all(
          volunteers.map((volunteer) =>
            volunteer.client.post(`/api/v1/social/events/${eventId}/participate`).expect(201),
          ),
        );

        const participants = await readSocialIds(
          world.admin,
          `/api/v1/social/events/${eventId}/participants`,
        );
        expect([...participants].sort()).toEqual(volunteers.map((v) => v.id).sort());
        expect(await myEventIds(outsider, 'participated')).not.toContain(eventId);
        await volunteers[0].client.post(`/api/v1/social/events/${eventId}/participate`).expect(409);
      },
      SCENARIO_TIMEOUT_MS,
    );

    it(
      'finishing an event is final: the state is FINISHED and a second transition is refused',
      async () => {
        const organizer = await world.signUp(UserRoles.ORGANIZATION);
        const volunteer = await world.signUp();
        const eventId = await createEvent(organizer);
        await publishAt(organizer, eventId, geo.marseille);
        await waitForSocialEventNode(world.admin, eventId);
        await volunteer.client.post(`/api/v1/social/events/${eventId}/participate`).expect(201);

        await changeState(organizer, eventId, EventState.EVENT_STATE_FINISHED).expect(200);
        const finished = await volunteer.client.get(`/api/v1/events/${eventId}`).expect(200);
        expect(String((finished.body as EventWebResponse).event.state)).toContain('FINISHED');

        // A second event.finished would credit the impact score twice: the transition is refused.
        const again = await changeState(organizer, eventId, EventState.EVENT_STATE_FINISHED);
        expect(again.status).toBeGreaterThanOrEqual(400);
        expect(again.status).toBeLessThan(500);
      },
      SCENARIO_TIMEOUT_MS,
    );

    it(
      'a cancelled event cannot be published again',
      async () => {
        const organizer = await world.signUp(UserRoles.ORGANIZATION);
        const eventId = await createEvent(organizer);
        await publishAt(organizer, eventId, geo.paris);

        await changeState(organizer, eventId, EventState.EVENT_STATE_CANCELLED).expect(200);
        const republish = await changeState(organizer, eventId, EventState.EVENT_STATE_PUBLISHED);
        expect(republish.status).toBeGreaterThanOrEqual(400);
        expect(republish.status).toBeLessThan(500);
      },
      SCENARIO_TIMEOUT_MS,
    );

    it(
      'deleting an event removes it from REST, search, the graph and the participants lists',
      async () => {
        const organizer = await world.signUp(UserRoles.ORGANIZATION);
        const volunteer = await world.signUp();
        const eventId = await createEvent(organizer);
        await publishAt(organizer, eventId, geo.lyon);
        await waitForSocialEventNode(world.admin, eventId);
        await volunteer.client.post(`/api/v1/social/events/${eventId}/participate`).expect(201);

        await volunteer.client.delete(`/api/v1/events/${eventId}`).expect(403);
        await organizer.client.delete(`/api/v1/events/${eventId}`).expect(200);

        await volunteer.client.get(`/api/v1/events/${eventId}`).expect(404);
        expect(await searchIds(volunteer, areaQuery(geo.lyon))).not.toContain(eventId);
        await waitForSocialEventNodeRemoved(world.admin, eventId);
        await waitForSocialIdsToExclude(
          world.admin,
          `/api/v1/social/users/${volunteer.id}/events/participated`,
          eventId,
          `PARTICIPATES link of ${volunteer.id} to the deleted event ${eventId}`,
        );
      },
      SCENARIO_TIMEOUT_MS,
    );

    it(
      'ordering: an event deleted right after its creation never stays in the social graph',
      async () => {
        // event.created and event.deleted travel on two streams read by two consumer groups of
        // post-processor-social. A later event used as a fence proves both were processed: streams
        // are read in order within a consumer group.
        const organizer = await world.signUp(UserRoles.ORGANIZATION);
        const eventId = await createEvent(organizer);
        await organizer.client.delete(`/api/v1/events/${eventId}`).expect(200);

        const fenceId = await createEvent(organizer);
        await waitForSocialEventNode(world.admin, fenceId);
        await organizer.client.delete(`/api/v1/events/${fenceId}`).expect(200);
        await waitForSocialEventNodeRemoved(world.admin, fenceId);

        await waitForSocialEventNodeRemoved(world.admin, eventId);
        expect(
          await readSocialIds(world.admin, `/api/v1/social/users/${organizer.id}/events/created`),
        ).not.toContain(eventId);
      },
      SCENARIO_TIMEOUT_MS,
    );

    // System gap G1 (README): ws-service waits for 'social_event.deleted_success' and
    // 'post_event.deleted_success', which no runner emits (post-processor-social emits
    // 'event_social.deleted'). The EVENT_DELETION gather never succeeds; in production the reaper
    // fails it after 60 s ('event.deletion_failed'), in this stack (NODE_ENV=test) it stays PENDING.
    // Turn it back into `it` once the feedback events are aligned.
    it.failing(
      "the organizer receives 'event.deleted' once the deletion saga completes",
      async () => {
        const organizer = await world.signUp(UserRoles.ORGANIZATION);
        const socket = await world.connect(organizer);
        const eventId = await createEvent(organizer);
        await waitForSocialEventNode(world.admin, eventId);

        const deleted = waitForSocketEvent<EventDeletedWsPayload>(
          socket,
          WS_EVENTS.EVENT_DELETED,
          (payload) => payload.eventId === eventId,
          {
            timeoutMs: EVENT_DELETED_WS_TIMEOUT_MS,
            description: `'event.deleted' for organizer ${organizer.id} (EVENT_DELETION gather)`,
          },
        );
        await organizer.client.delete(`/api/v1/events/${eventId}`).expect(200);

        await expect(deleted).resolves.toEqual(expect.objectContaining({ eventId }));
      },
      SCENARIO_TIMEOUT_MS,
    );
  });

  describe('needs post-processor-event (geocoding, EVENT_GEOCODED)', () => {
    it.todo(
      "event.created: the organizer receives 'event.created' and the other users get the broadcast (EVENT_CREATION gather waits for GEOCODED_SUCCESS)",
    );
    it.todo(
      'event.created: an event created with only a localisationName is geocoded and found by an area search around the geocoded point',
    );
    it.todo(
      "event.created: an unknown localisationName ends in 'event.creation_failed' for the organizer (no EVENT_GEOCODING_FAILED emitter today: reaper after 60 s)",
    );
  });

  describe('needs post-processor-user, outbox-ws and post-processor-event', () => {
    it.todo(
      "event.finished: each participant receives 'user.impact_score_credited' once and GET /users/me shows the new score",
    );
    it.todo(
      'event.creation_successfull: the organizer earns the event creation badge (outbox-ws -> post-processor-user)',
    );
  });

  describe('needs post-processor-storage, worker-storage and outbox-storage', () => {
    it.todo(
      'event.cover_replaced: a scanned cover becomes READY with a coverUrl, the previous file is purged',
    );
    it.todo('event.deleted: the cover file of the deleted event is purged');
  });
});
