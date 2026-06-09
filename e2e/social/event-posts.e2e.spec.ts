/**
 * E2E Tests — Event-Post Relationships
 *
 * Covers:
 *   - GET /api/v1/social/events/:eventId/related-posts  (EventPostLinkController)
 *   - POST /api/v1/social/events/:eventId/posts/:postId  (link)
 *   - DELETE /api/v1/social/events/:eventId/posts/:postId (unlink)
 *   - Authorization checks (403 / 401)
 *
 * Setup strategy:
 *   - Events are created via ms-event (POST /api/v1/events) and their social node
 *     is registered synchronously (POST /api/v1/social/events/:id), bypassing the async outbox.
 *   - Social post nodes are created directly via the admin endpoint
 *     POST /api/v1/social/posts/:id without going through ms-post (which requires
 *     a running ms-post instance not available in this E2E environment).
 *   - All write operations use ADMIN tokens (same pattern as all existing E2E tests).
 *   - Links are created via POST /api/v1/social/events/:eventId/posts/:postId.
 */

import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createApp } from '../helpers/create-app.helper.js';
import { createTestClient } from '../helpers/test-client.helper.js';
import type { TestClient } from '../helpers/test-client.helper.js';
import { UserRoles } from '@volontariapp/shared';
import type { IdsListWebResponse } from '@volontariapp/contracts';
import {
  createEventWithSocialNode,
  cleanupEvent,
  assertIdsListContains,
} from './event-posts-test.helpers.js';

// ─── Shared app instance ──────────────────────────────────────────────────────

describe('Event ↔ Post Relationships (E2E)', () => {
  let app: INestApplication;
  let admin: TestClient;

  beforeAll(async () => {
    app = await createApp();
    admin = await createTestClient(app).login({ id: randomUUID(), role: UserRoles.ADMIN });
  });

  afterAll(async () => {
    await app.close();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // GET /social/events/:eventId/related-posts
  // ───────────────────────────────────────────────────────────────────────────

  describe('GET /social/events/:eventId/related-posts', () => {
    it('should return an empty list when an event has no linked posts', async () => {
      const { eventId } = await createEventWithSocialNode(admin);

      try {
        const res = await admin.get(`/api/v1/social/events/${eventId}/related-posts`).expect(200);

        expect((res.body as IdsListWebResponse).ids).toEqual([]);
      } finally {
        await cleanupEvent(admin, eventId);
      }
    });

    it('should return linked post ids after linking posts to an event', async () => {
      const { eventId } = await createEventWithSocialNode(admin);
      const postId1 = randomUUID();
      const postId2 = randomUUID();
      await admin.post(`/api/v1/social/posts/${postId1}`).expect(201);
      await admin.post(`/api/v1/social/posts/${postId2}`).expect(201);

      try {
        await admin.post(`/api/v1/social/events/${eventId}/posts/${postId1}`).expect(201);
        await admin.post(`/api/v1/social/events/${eventId}/posts/${postId2}`).expect(201);

        const res = await admin.get(`/api/v1/social/events/${eventId}/related-posts`).expect(200);

        const body = res.body as IdsListWebResponse;
        expect(body.ids).toHaveLength(2);
        assertIdsListContains(body, postId1, postId2);
      } finally {
        await admin.delete(`/api/v1/social/events/${eventId}/posts/${postId1}`);
        await admin.delete(`/api/v1/social/events/${eventId}/posts/${postId2}`);
        await admin.delete(`/api/v1/social/posts/${postId1}`);
        await admin.delete(`/api/v1/social/posts/${postId2}`);
        await cleanupEvent(admin, eventId);
      }
    });

    it('should remove the post from related-posts after unlinking', async () => {
      const { eventId } = await createEventWithSocialNode(admin);
      const postId = randomUUID();
      await admin.post(`/api/v1/social/posts/${postId}`).expect(201);

      try {
        await admin.post(`/api/v1/social/events/${eventId}/posts/${postId}`).expect(201);

        const resBefore = await admin
          .get(`/api/v1/social/events/${eventId}/related-posts`)
          .expect(200);
        expect((resBefore.body as IdsListWebResponse).ids).toContain(postId);

        await admin.delete(`/api/v1/social/events/${eventId}/posts/${postId}`).expect(200);

        const resAfter = await admin
          .get(`/api/v1/social/events/${eventId}/related-posts`)
          .expect(200);
        expect((resAfter.body as IdsListWebResponse).ids).not.toContain(postId);
      } finally {
        await cleanupEvent(admin, eventId);
        await admin.delete(`/api/v1/social/posts/${postId}`);
      }
    });

    it('should return 404 when the event does not exist in ms-event', async () => {
      const res = await admin
        .get(`/api/v1/social/events/${randomUUID()}/related-posts`)
        .expect(404);

      expect((res.body as { message: string }).message).toBeDefined();
    });

    it('should isolate posts: event A only shows its own linked posts', async () => {
      const { eventId: eventIdA } = await createEventWithSocialNode(admin);
      const { eventId: eventIdB } = await createEventWithSocialNode(admin);
      const postIdA = randomUUID();
      const postIdB = randomUUID();
      await admin.post(`/api/v1/social/posts/${postIdA}`).expect(201);
      await admin.post(`/api/v1/social/posts/${postIdB}`).expect(201);

      try {
        await admin.post(`/api/v1/social/events/${eventIdA}/posts/${postIdA}`).expect(201);
        await admin.post(`/api/v1/social/events/${eventIdB}/posts/${postIdB}`).expect(201);

        const resA = await admin.get(`/api/v1/social/events/${eventIdA}/related-posts`).expect(200);
        expect((resA.body as IdsListWebResponse).ids).toContain(postIdA);
        expect((resA.body as IdsListWebResponse).ids).not.toContain(postIdB);

        const resB = await admin.get(`/api/v1/social/events/${eventIdB}/related-posts`).expect(200);
        expect((resB.body as IdsListWebResponse).ids).toContain(postIdB);
        expect((resB.body as IdsListWebResponse).ids).not.toContain(postIdA);
      } finally {
        await admin.delete(`/api/v1/social/events/${eventIdA}/posts/${postIdA}`);
        await admin.delete(`/api/v1/social/events/${eventIdB}/posts/${postIdB}`);
        await cleanupEvent(admin, eventIdA);
        await cleanupEvent(admin, eventIdB);
        await admin.delete(`/api/v1/social/posts/${postIdA}`);
        await admin.delete(`/api/v1/social/posts/${postIdB}`);
      }
    });

    it('should accumulate posts from multiple authors on the same event', async () => {
      const adminA: TestClient = await createTestClient(app).login({
        id: randomUUID(),
        role: UserRoles.ADMIN,
      });
      const adminB: TestClient = await createTestClient(app).login({
        id: randomUUID(),
        role: UserRoles.ADMIN,
      });

      const { eventId } = await createEventWithSocialNode(admin);
      const postIdA = randomUUID();
      const postIdB = randomUUID();
      await adminA.post(`/api/v1/social/posts/${postIdA}`).expect(201);
      await adminB.post(`/api/v1/social/posts/${postIdB}`).expect(201);

      try {
        await admin.post(`/api/v1/social/events/${eventId}/posts/${postIdA}`).expect(201);
        await admin.post(`/api/v1/social/events/${eventId}/posts/${postIdB}`).expect(201);

        const res = await admin.get(`/api/v1/social/events/${eventId}/related-posts`).expect(200);

        const body = res.body as IdsListWebResponse;
        expect(body.ids).toHaveLength(2);
        assertIdsListContains(body, postIdA, postIdB);
      } finally {
        await admin.delete(`/api/v1/social/events/${eventId}/posts/${postIdA}`);
        await admin.delete(`/api/v1/social/events/${eventId}/posts/${postIdB}`);
        await admin.delete(`/api/v1/social/posts/${postIdA}`);
        await admin.delete(`/api/v1/social/posts/${postIdB}`);
        await cleanupEvent(admin, eventId);
      }
    });

    it('should return all linked posts when no pagination is specified', async () => {
      const { eventId } = await createEventWithSocialNode(admin);
      const postIds: string[] = [];

      for (let i = 0; i < 5; i++) {
        const postId = randomUUID();
        await admin.post(`/api/v1/social/posts/${postId}`).expect(201);
        await admin.post(`/api/v1/social/events/${eventId}/posts/${postId}`).expect(201);
        postIds.push(postId);
      }

      try {
        const res = await admin.get(`/api/v1/social/events/${eventId}/related-posts`).expect(200);

        const body = res.body as IdsListWebResponse;
        // All 5 posts should be returned (default limit is 10)
        expect(body.ids.length).toBe(5);
        for (const id of postIds) {
          expect(body.ids).toContain(id);
        }
      } finally {
        for (const postId of postIds) {
          await admin.delete(`/api/v1/social/events/${eventId}/posts/${postId}`);
          await admin.delete(`/api/v1/social/posts/${postId}`);
        }
        await cleanupEvent(admin, eventId);
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Authorization checks
  // ───────────────────────────────────────────────────────────────────────────

  describe('Authorization — event-post link management', () => {
    it('should return 403 when a volunteer tries to link a post to an event', async () => {
      const volunteer: TestClient = await createTestClient(app).login({
        id: randomUUID(),
        role: UserRoles.VOLUNTEER,
      });

      const { eventId } = await createEventWithSocialNode(admin);
      const postId = randomUUID();
      await admin.post(`/api/v1/social/posts/${postId}`).expect(201);

      try {
        await volunteer.post(`/api/v1/social/events/${eventId}/posts/${postId}`).expect(403);
      } finally {
        await cleanupEvent(admin, eventId);
        await admin.delete(`/api/v1/social/posts/${postId}`);
      }
    });

    it('should return 403 when a volunteer tries to unlink a post from an event', async () => {
      const volunteer: TestClient = await createTestClient(app).login({
        id: randomUUID(),
        role: UserRoles.VOLUNTEER,
      });

      const { eventId } = await createEventWithSocialNode(admin);
      const postId = randomUUID();
      await admin.post(`/api/v1/social/posts/${postId}`).expect(201);
      await admin.post(`/api/v1/social/events/${eventId}/posts/${postId}`).expect(201);

      try {
        await volunteer.delete(`/api/v1/social/events/${eventId}/posts/${postId}`).expect(403);
      } finally {
        await admin.delete(`/api/v1/social/events/${eventId}/posts/${postId}`);
        await cleanupEvent(admin, eventId);
        await admin.delete(`/api/v1/social/posts/${postId}`);
      }
    });

    it('should return 401 when no token is provided', async () => {
      const unauthClient = createTestClient(app);
      const { eventId } = await createEventWithSocialNode(admin);

      try {
        await unauthClient.get(`/api/v1/social/events/${eventId}/related-posts`).expect(401);
        await unauthClient
          .post(`/api/v1/social/events/${eventId}/posts/${randomUUID()}`)
          .expect(401);
        await unauthClient
          .delete(`/api/v1/social/events/${eventId}/posts/${randomUUID()}`)
          .expect(401);
      } finally {
        await cleanupEvent(admin, eventId);
      }
    });
  });
});
