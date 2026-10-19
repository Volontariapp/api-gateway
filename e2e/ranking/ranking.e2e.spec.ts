import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  RecordEventFeedbackWebResponse,
  RequestRankingRefreshWebResponse,
  UpdateUserLocationWebResponse,
} from '@volontariapp/contracts';
import { UserRoles } from '@volontariapp/shared';
import { createApp } from '../helpers/create-app.helper.js';
import { createTestClient } from '../helpers/test-client.helper.js';
import type { TestClient } from '../helpers/test-client.helper.js';

/**
 * The CI compose (ci-tools) does not start ms-ranking yet and the e2e matrix validator does not
 * know it: the scenarios that reach ms-ranking only run when E2E_RANKING_ENABLED=true. The routing
 * checks below need no ms-ranking and always run.
 */
const describeWithRanking = process.env.E2E_RANKING_ENABLED === 'true' ? describe : describe.skip;

describe('Ranking routes (E2E)', () => {
  let app: INestApplication;
  let client: TestClient;

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    client = await createTestClient(app).login({ id: randomUUID(), role: UserRoles.VOLUNTEER });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('routing', () => {
    it('should require authentication on every ranking route', async () => {
      const anonymous = createTestClient(app);
      await anonymous.get('/api/v1/ranking/events').expect(401);
      await anonymous.get('/api/v1/ranking/feed').expect(401);
      await anonymous.post('/api/v1/ranking/refresh').send({ listKind: 'EVENT' }).expect(401);
      await anonymous.put('/api/v1/ranking/location').send({ lat: 48.85, lng: 2.35 }).expect(401);
      await anonymous
        .post('/api/v1/ranking/events/feedback')
        .send({ items: [{ eventId: randomUUID(), action: 'PASS' }] })
        .expect(401);
    });

    it('should validate the bodies before calling ms-ranking', async () => {
      await client.post('/api/v1/ranking/refresh').send({ listKind: 'USER' }).expect(400);
      await client.put('/api/v1/ranking/location').send({ lat: 120, lng: 2.35 }).expect(400);
      const tooMany = Array.from({ length: 51 }, () => ({ eventId: randomUUID(), action: 'PASS' }));
      await client.post('/api/v1/ranking/events/feedback').send({ items: tooMany }).expect(400);
    });

    it('should leave GET /events/:id unchanged', async () => {
      await client.get(`/api/v1/events/${randomUUID()}`).expect(404);
    });
  });

  describeWithRanking('with ms-ranking', () => {
    it('should answer 206 FALLBACK_ACTIVATED to a new account on the events', async () => {
      const res = await client.get('/api/v1/ranking/events?limit=20').expect(206);
      expect((res.body as { code: string }).code).toBe('FALLBACK_ACTIVATED');
    });

    it('should answer 206 FALLBACK_ACTIVATED to a new account on the feed', async () => {
      const res = await client.get('/api/v1/ranking/feed').expect(206);
      expect((res.body as { code: string }).code).toBe('FALLBACK_ACTIVATED');
    });

    it('should accept a refresh and throttle the sixth one in a minute', async () => {
      const throttled: boolean[] = [];
      for (let i = 0; i < 6; i++) {
        const listKind = i % 2 === 0 ? 'EVENT' : 'POST';
        const res = await client.post('/api/v1/ranking/refresh').send({ listKind }).expect(200);
        throttled.push((res.body as RequestRankingRefreshWebResponse).refreshThrottled);
      }
      expect(throttled).toEqual([false, false, false, false, false, true]);
    });

    it('should accept the first position and ignore a second one within a minute', async () => {
      const first = await client
        .put('/api/v1/ranking/location')
        .send({ lat: 48.8566, lng: 2.3522 })
        .expect(200);
      const second = await client
        .put('/api/v1/ranking/location')
        .send({ lat: 45.764, lng: 4.8357 })
        .expect(200);
      expect((first.body as UpdateUserLocationWebResponse).accepted).toBe(true);
      expect((second.body as UpdateUserLocationWebResponse).accepted).toBe(false);
    });

    it('should record a batch of PASS', async () => {
      const items = [randomUUID(), randomUUID()].map((eventId) => ({ eventId, action: 'PASS' }));
      const res = await client.post('/api/v1/ranking/events/feedback').send({ items }).expect(200);
      expect((res.body as RecordEventFeedbackWebResponse).recorded).toBe(2);
    });
  });
});
