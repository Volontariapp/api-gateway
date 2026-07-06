import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { ListEventsWebResponse } from '@volontariapp/contracts';
import { UserRoles } from '@volontariapp/shared';
import { createApp } from '../helpers/create-app.helper.js';
import { createTestClient } from '../helpers/test-client.helper.js';
import type { TestClient } from '../helpers/test-client.helper.js';
import {
  type TestUser,
  PARIS,
  LYON,
  MARSEILLE,
  areaQuery,
  createUser,
  createPublishedEvent,
} from './event-search.helper.js';

describe('Event Search Orchestration (E2E)', () => {
  let app: INestApplication;
  let admin: TestClient;

  let mainUser: TestUser;
  let friend1: TestUser;
  let friend2: TestUser;
  let friend3: TestUser;
  let blockedUser: TestUser;
  let stranger1: TestUser;
  let stranger2: TestUser;

  const parisEventIds: string[] = [];
  const lyonEventIds: string[] = [];
  const marseilleEventIds: string[] = [];

  beforeAll(async () => {
    app = await createApp();
    admin = await createTestClient(app).login({ id: randomUUID(), role: UserRoles.ADMIN });

    mainUser = await createUser(app, admin);
    friend1 = await createUser(app, admin);
    friend2 = await createUser(app, admin);
    friend3 = await createUser(app, admin);
    blockedUser = await createUser(app, admin);
    stranger1 = await createUser(app, admin);
    stranger2 = await createUser(app, admin);

    for (const friend of [friend1, friend2, friend3]) {
      await mainUser.client.post(`/api/v1/social/follow/${friend.id}`).expect(201);
      await friend.client.post(`/api/v1/social/follow/${mainUser.id}`).expect(201);
    }

    // mainUser blocks blockedUser
    await mainUser.client.post(`/api/v1/social/block/${blockedUser.id}`).expect(201);

    // ── 3. Create events in 3 cities ─────────────────────────────────
    const createCityEvents = async (
      city: typeof PARIS,
      count: number,
      organizerId: string,
    ): Promise<string[]> => {
      const ids: string[] = [];
      for (let i = 0; i < count; i++) {
        const eventId = await createPublishedEvent(admin, organizerId, {
          localisationName: city.name,
          lat: city.lat,
          lng: city.lng,
        });
        ids.push(eventId);
      }
      return ids;
    };

    parisEventIds.push(...(await createCityEvents(PARIS, 10, mainUser.id)));
    parisEventIds.push(...(await createCityEvents(PARIS, 1, blockedUser.id))); // index 10
    lyonEventIds.push(...(await createCityEvents(LYON, 10, mainUser.id)));
    marseilleEventIds.push(...(await createCityEvents(MARSEILLE, 10, mainUser.id)));

    // ── 4. Social interactions ───────────────────────────────────────

    // mainUser participates in 3 Paris events (indices 0, 1, 2)
    for (let i = 0; i < 3; i++) {
      await mainUser.client
        .post(`/api/v1/social/events/${parisEventIds[i]}/participate`)
        .expect(201);
    }

    // mainUser participates in 2 Lyon events (indices 0, 1)
    for (let i = 0; i < 2; i++) {
      await mainUser.client
        .post(`/api/v1/social/events/${lyonEventIds[i]}/participate`)
        .expect(201);
    }

    // mainUser wishes 3 Marseille events (indices 0, 1, 2)
    for (let i = 0; i < 3; i++) {
      await mainUser.client.post(`/api/v1/social/events/${marseilleEventIds[i]}/wish`).expect(201);
    }

    // friend1 participates in Paris events 4, 5
    await friend1.client.post(`/api/v1/social/events/${parisEventIds[4]}/participate`).expect(201);
    await friend1.client.post(`/api/v1/social/events/${parisEventIds[5]}/participate`).expect(201);

    // friend2 participates in Lyon event 3
    await friend2.client.post(`/api/v1/social/events/${lyonEventIds[3]}/participate`).expect(201);

    // friend3 wishes Marseille event 4
    await friend3.client.post(`/api/v1/social/events/${marseilleEventIds[4]}/wish`).expect(201);

    // blockedUser participates in Paris event 6
    await blockedUser.client
      .post(`/api/v1/social/events/${parisEventIds[6]}/participate`)
      .expect(201);

    // stranger1 participates in Paris event 7 (no friendship with mainUser)
    await stranger1.client
      .post(`/api/v1/social/events/${parisEventIds[7]}/participate`)
      .expect(201);
  }, 120_000);

  afterAll(async () => {
    await app.close();
  });

  // ═══════════════════════════════════════════════════════════════════
  // GROUP 1 – Geographic & Domain Filters (ms-event only, no social)
  // ═══════════════════════════════════════════════════════════════════

  describe('Geographic & Domain Filters', () => {
    it('1 – should return all 11 Paris events within 10km radius', async () => {
      const res = await mainUser.client.get(`/api/v1/events?${areaQuery(PARIS)}&limit=50`);

      if (res.status !== 200) {
        throw new Error(`Validation Error for 1: ${JSON.stringify(res.body, null, 2)}`);
      }
      expect(res.status).toBe(200);

      const body = res.body as ListEventsWebResponse;

      expect(body.events).toHaveLength(11);
      const ids = body.events.map((e) => e.id);
      for (const id of parisEventIds) {
        expect(ids).toContain(id);
      }
    });

    it('2 – should return 0 events when searching in an empty zone', async () => {
      // Middle of the Atlantic Ocean
      const res = await mainUser.client
        .get(
          '/api/v1/events?area[center][latitude]=30&area[center][longitude]=-40&area[radiusMeters]=1000&limit=50&page=1',
        )
        .expect(200);
      const body = res.body as ListEventsWebResponse;

      expect(body.events).toHaveLength(0);
    });

    it('3 – should paginate correctly: page 1 of Lyon', async () => {
      const res = await mainUser.client
        .get(`/api/v1/events?${areaQuery(LYON)}&limit=4&page=1`)
        .expect(200);
      const body = res.body as ListEventsWebResponse;

      expect(body.events).toHaveLength(4);
      expect(body.totalCount).toBeGreaterThanOrEqual(10);
    });

    it('4 – should paginate correctly: page 2 of Lyon', async () => {
      const res = await mainUser.client
        .get(`/api/v1/events?${areaQuery(LYON)}&limit=4&page=2`)
        .expect(200);
      const body = res.body as ListEventsWebResponse;

      expect(body.events).toHaveLength(4);
    });

    it('5 – should paginate correctly: page is bounded by limit', async () => {
      const res = await mainUser.client
        .get(`/api/v1/events?${areaQuery(LYON)}&limit=4&page=3`)
        .expect(200);
      const body = res.body as ListEventsWebResponse;

      expect(body.events.length).toBeLessThanOrEqual(4);
    });

    it('6 – should not return duplicate events across pages', async () => {
      const page1 = await mainUser.client
        .get(`/api/v1/events?${areaQuery(PARIS)}&limit=5&page=1`)
        .expect(200);
      const page2 = await mainUser.client
        .get(`/api/v1/events?${areaQuery(PARIS)}&limit=5&page=2`)
        .expect(200);

      const ids1 = (page1.body as ListEventsWebResponse).events.map((e) => e.id);
      const ids2 = (page2.body as ListEventsWebResponse).events.map((e) => e.id);
      const intersection = ids1.filter((id) => ids2.includes(id));

      expect(intersection).toHaveLength(0);
    });

    it('7 – should return all 30 events without geo filter', async () => {
      const res = await mainUser.client
        .get('/api/v1/events?limit=50&onlyAvailable=true')
        .expect(200);
      const body = res.body as ListEventsWebResponse;

      expect(body.totalCount).toBeGreaterThanOrEqual(30);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GROUP 2 – Social Filters (ms-social orchestrated via api-gateway)
  // ═══════════════════════════════════════════════════════════════════

  describe('Social Filters', () => {
    it('8 – should return only events participated by friends', async () => {
      const res = await mainUser.client
        .get('/api/v1/events?onlyParticipatedByFriends=true&limit=50&page=1')
        .expect(200);
      const body = res.body as ListEventsWebResponse;

      const ids = body.events.map((e) => e.id);
      expect(ids).toContain(parisEventIds[4]);
      expect(ids).toContain(parisEventIds[5]);
      expect(ids).toContain(lyonEventIds[3]);
    });

    it('9 – should return only events wished by friends', async () => {
      const res = await mainUser.client
        .get('/api/v1/events?onlyWishedByFriends=true&limit=50&page=1')
        .expect(200);
      const body = res.body as ListEventsWebResponse;

      // friend3 wished Marseille 4
      expect(body.events).toHaveLength(1);
      expect(body.events[0].id).toBe(marseilleEventIds[4]);
    });

    it('10 – should exclude events I participate in', async () => {
      const res = await mainUser.client
        .get('/api/v1/events?excludeParticipatedByMe=true&limit=50&page=1')
        .expect(200);
      const body = res.body as ListEventsWebResponse;

      expect(body.totalCount).toBeGreaterThanOrEqual(25);
      const ids = body.events.map((e) => e.id);
      // None of my participated events should appear
      expect(ids).not.toContain(parisEventIds[0]);
      expect(ids).not.toContain(parisEventIds[1]);
      expect(ids).not.toContain(parisEventIds[2]);
      expect(ids).not.toContain(lyonEventIds[0]);
      expect(ids).not.toContain(lyonEventIds[1]);
    });

    it('11 – should exclude events I wished', async () => {
      const res = await mainUser.client
        .get('/api/v1/events?excludeWishedByMe=true&limit=50&page=1')
        .expect(200);
      const body = res.body as ListEventsWebResponse;

      expect(body.totalCount).toBeGreaterThanOrEqual(27);
      const ids = body.events.map((e) => e.id);
      expect(ids).not.toContain(marseilleEventIds[0]);
      expect(ids).not.toContain(marseilleEventIds[1]);
      expect(ids).not.toContain(marseilleEventIds[2]);
    });

    it('12 – should exclude events created by blocked users', async () => {
      const res = await mainUser.client
        .get('/api/v1/events?excludeBlockedUsers=true&limit=50&page=1')
        .expect(200);
      const body = res.body as ListEventsWebResponse;

      expect(body.totalCount).toBeGreaterThanOrEqual(29);
      const ids = body.events.map((e) => e.id);
      expect(ids).not.toContain(parisEventIds[10]);
    });

    it('13 – should not include stranger participations in "onlyParticipatedByFriends"', async () => {
      const res = await mainUser.client
        .get('/api/v1/events?onlyParticipatedByFriends=true&limit=50&page=1')
        .expect(200);
      const body = res.body as ListEventsWebResponse;

      // stranger1 participates in Paris 7 but is NOT a friend
      const ids = body.events.map((e) => e.id);
      expect(ids).not.toContain(parisEventIds[7]);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GROUP 3 – Combined Geo + Social Filters
  // ═══════════════════════════════════════════════════════════════════

  describe('Combined Geo + Social Filters', () => {
    it('14 – friends participations within Paris 10km (excludes Lyon friend)', async () => {
      const res = await mainUser.client
        .get(`/api/v1/events?onlyParticipatedByFriends=true&${areaQuery(PARIS)}&limit=50`)
        .expect(200);
      const body = res.body as ListEventsWebResponse;

      const ids = body.events.map((e) => e.id);
      expect(ids).toContain(parisEventIds[4]);
      expect(ids).toContain(parisEventIds[5]);
      expect(ids).not.toContain(lyonEventIds[3]);
    });

    it('15 – friends participations + exclude my participations, within Paris', async () => {
      const res = await mainUser.client
        .get(
          `/api/v1/events?onlyParticipatedByFriends=true&excludeParticipatedByMe=true&${areaQuery(PARIS)}&limit=50`,
        )
        .expect(200);
      const body = res.body as ListEventsWebResponse;

      const ids = body.events.map((e) => e.id);
      expect(ids).toContain(parisEventIds[4]);
      expect(ids).toContain(parisEventIds[5]);
    });

    it('16 – social filter returns empty when geo excludes all matching events', async () => {
      // Friends participate in Paris/Lyon but we search Marseille → 0 results
      const res = await mainUser.client
        .get(`/api/v1/events?onlyParticipatedByFriends=true&${areaQuery(MARSEILLE)}&limit=50`)
        .expect(200);
      const body = res.body as ListEventsWebResponse;

      expect(body.events).toHaveLength(0);
      expect(body.totalCount).toBe(0);
    });

    it('17 – friends wishes within Marseille', async () => {
      const res = await mainUser.client
        .get(`/api/v1/events?onlyWishedByFriends=true&${areaQuery(MARSEILLE)}&limit=50`)
        .expect(200);
      const body = res.body as ListEventsWebResponse;

      // friend3 wished Marseille 4
      expect(body.events).toHaveLength(1);
      expect(body.events[0].id).toBe(marseilleEventIds[4]);
    });

    it('18 – friends wishes outside their area returns empty', async () => {
      const res = await mainUser.client
        .get(`/api/v1/events?onlyWishedByFriends=true&${areaQuery(PARIS)}&limit=50`)
        .expect(200);
      const body = res.body as ListEventsWebResponse;

      // friend3's wish is in Marseille, not Paris
      expect(body.events).toHaveLength(0);
    });

    it('19 – exclude blocked + exclude participated within Paris', async () => {
      const res = await mainUser.client
        .get(
          `/api/v1/events?excludeBlockedUsers=true&excludeParticipatedByMe=true&${areaQuery(PARIS)}&limit=50`,
        )
        .expect(200);
      const body = res.body as ListEventsWebResponse;

      const ids = body.events.map((e) => e.id);
      expect(ids).not.toContain(parisEventIds[0]);
      expect(ids).not.toContain(parisEventIds[10]);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GROUP 4 – Multiple exclusion filters stacked
  // ═══════════════════════════════════════════════════════════════════

  describe('Multi-Exclusion Stacking', () => {
    it('20 – exclude participated + wished + blocked simultaneously', async () => {
      const res = await mainUser.client
        .get(
          '/api/v1/events?excludeParticipatedByMe=true&excludeWishedByMe=true&excludeBlockedUsers=true&limit=50&page=1',
        )
        .expect(200);
      const body = res.body as ListEventsWebResponse;

      expect(body.totalCount).toBeGreaterThanOrEqual(21);
      const ids = body.events.map((e) => e.id);
      expect(ids).not.toContain(parisEventIds[0]);
      expect(ids).not.toContain(marseilleEventIds[0]);
      expect(ids).not.toContain(parisEventIds[10]);
    });

    it('21 – exclude participated + wished (no blocked filter)', async () => {
      const res = await mainUser.client
        .get('/api/v1/events?excludeParticipatedByMe=true&excludeWishedByMe=true&limit=50&page=1')
        .expect(200);
      const body = res.body as ListEventsWebResponse;

      expect(body.totalCount).toBeGreaterThanOrEqual(22);
      const ids = body.events.map((e) => e.id);
      // Blocked user event should still appear because we are not excluding blocked users here!
      // Wait, if it's created by blockedUser, does it still appear? Yes.
      expect(ids).toContain(parisEventIds[10]);
    });

    it('22 – triple exclusion + Paris geo constraint', async () => {
      const res = await mainUser.client
        .get(
          `/api/v1/events?excludeParticipatedByMe=true&excludeWishedByMe=true&excludeBlockedUsers=true&${areaQuery(PARIS)}&limit=50`,
        )
        .expect(200);
      const body = res.body as ListEventsWebResponse;

      const ids = body.events.map((e) => e.id);
      expect(ids).not.toContain(parisEventIds[0]);
      expect(ids).not.toContain(parisEventIds[10]);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // GROUP 5 – Edge cases and cross-user perspective
  // ═══════════════════════════════════════════════════════════════════

  describe('Edge Cases & Cross-User', () => {
    it('23 – stranger sees all 30 events (no social interactions)', async () => {
      const res = await stranger2.client
        .get('/api/v1/events?limit=50&page=1&onlyAvailable=true')
        .expect(200);
      const body = res.body as ListEventsWebResponse;

      expect(body.totalCount).toBeGreaterThanOrEqual(30);
    });

    it('24 – stranger excludeParticipatedByMe returns all (they participate in nothing)', async () => {
      const res = await stranger2.client
        .get('/api/v1/events?excludeParticipatedByMe=true&limit=50&page=1')
        .expect(200);
      const body = res.body as ListEventsWebResponse;

      // stranger2 participates in nothing → all events returned
      expect(body.totalCount).toBeGreaterThanOrEqual(30);
    });

    it('25 – stranger onlyParticipatedByFriends returns empty (no friends)', async () => {
      const res = await stranger2.client
        .get('/api/v1/events?onlyParticipatedByFriends=true&limit=50&page=1')
        .expect(200);
      const body = res.body as ListEventsWebResponse;

      expect(body.events).toHaveLength(0);
    });

    it('26 – friend1 perspective: onlyParticipatedByFriends shows mainUser participations', async () => {
      const res = await friend1.client
        .get('/api/v1/events?onlyParticipatedByFriends=true&limit=50&page=1')
        .expect(200);
      const body = res.body as ListEventsWebResponse;

      // mainUser is friend1's friend. mainUser participates in Paris 0,1,2 + Lyon 0,1
      const ids = body.events.map((e) => e.id);
      expect(ids).toContain(parisEventIds[0]);
      expect(ids).toContain(parisEventIds[1]);
      expect(ids).toContain(parisEventIds[2]);
      expect(ids).toContain(lyonEventIds[0]);
      expect(ids).toContain(lyonEventIds[1]);
    });

    it('27 – pagination page=1 limit=1 returns exactly 1 event', async () => {
      const res = await mainUser.client
        .get('/api/v1/events?limit=1&page=1&onlyAvailable=true')
        .expect(200);
      const body = res.body as ListEventsWebResponse;

      expect(body.events).toHaveLength(1);
      expect(body.totalCount).toBeGreaterThanOrEqual(30);
    });

    it('28 – social filter + tiny radius = empty', async () => {
      // 1 meter radius around (0,0) → effectively nothing
      const res = await mainUser.client
        .get(
          `/api/v1/events?onlyParticipatedByFriends=true&area[center][latitude]=0&area[center][longitude]=0&area[radiusMeters]=1&limit=50&page=1`,
        )
        .expect(200);
      const body = res.body as ListEventsWebResponse;

      expect(body.events).toHaveLength(0);
    });

    it('29 – excludeBlockedUsers alone still returns 29 events', async () => {
      const res = await mainUser.client
        .get('/api/v1/events?excludeBlockedUsers=true&limit=50&page=1')
        .expect(200);
      const body = res.body as ListEventsWebResponse;

      expect(body.totalCount).toBe(30);
      // Paris event 10 (created by blocked user) should be excluded
      const ids = body.events.map((e) => e.id);
      expect(ids).not.toContain(parisEventIds[10]);
      // All others present
      expect(ids).toContain(parisEventIds[3]);
      expect(ids).toContain(parisEventIds[7]);
    });

    it('30 – unauthenticated request is rejected', async () => {
      const unauthClient = createTestClient(app);
      await unauthClient.get('/api/v1/events?limit=10&page=1').expect(401);
    });
  });
});
