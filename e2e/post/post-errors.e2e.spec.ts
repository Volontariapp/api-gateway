import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createApp } from '../helpers/create-app.helper.js';
import type { TestClient } from '../helpers/test-client.helper.js';
import { createTestClient } from '../helpers/test-client.helper.js';
import type {
  PostWebResponse,
  ActionSuccessWebResponse,
  ListCommentsWebResponse,
} from '@volontariapp/contracts';
import { UserRoles } from '@volontariapp/shared';
import { createPostRequestFactory, createCommentRequestFactory } from './post-test.factory.js';
import { createPost, createComment } from './post-test.helpers.js';

describe('Post & Comment — Error Cases (E2E)', () => {
  let app: INestApplication;
  let client: TestClient;

  beforeAll(async () => {
    app = await createApp();
    client = await createTestClient(app).login({ id: randomUUID(), role: UserRoles.ADMIN });
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── 401 — Unauthenticated ─────────────────────────────────────────────────

  describe('401 — Unauthenticated', () => {
    it('should return 401 when creating a post without token', async () => {
      const unauthClient = createTestClient(app);
      await unauthClient.post('/api/v1/posts').send(createPostRequestFactory()).expect(401);
    });

    it('should return 401 when getting a post without token', async () => {
      const { postId } = await createPost(client);
      try {
        await createTestClient(app).get(`/api/v1/posts/${postId}`).expect(401);
      } finally {
        await client.delete(`/api/v1/posts/${postId}`).expect(200);
      }
    });

    it('should return 401 when listing posts without token', async () => {
      await createTestClient(app).get('/api/v1/posts').expect(401);
    });

    it('should return 401 when updating a post without token', async () => {
      const { postId } = await createPost(client);
      try {
        await createTestClient(app)
          .patch(`/api/v1/posts/${postId}`)
          .send({ title: 'Hacked' })
          .expect(401);
      } finally {
        await client.delete(`/api/v1/posts/${postId}`).expect(200);
      }
    });

    it('should return 401 when deleting a post without token', async () => {
      const { postId } = await createPost(client);
      try {
        await createTestClient(app).delete(`/api/v1/posts/${postId}`).expect(401);
      } finally {
        await client.delete(`/api/v1/posts/${postId}`).expect(200);
      }
    });

    it('should return 401 when creating a comment without token', async () => {
      const { postId } = await createPost(client);
      try {
        await createTestClient(app)
          .post(`/api/v1/posts/${postId}/comments`)
          .send(createCommentRequestFactory())
          .expect(401);
      } finally {
        await client.delete(`/api/v1/posts/${postId}`).expect(200);
      }
    });

    it('should return 401 when listing comments without token', async () => {
      const { postId } = await createPost(client);
      try {
        await createTestClient(app).get(`/api/v1/posts/${postId}/comments`).expect(401);
      } finally {
        await client.delete(`/api/v1/posts/${postId}`).expect(200);
      }
    });

    it('should return 401 when deleting a comment without token', async () => {
      const { postId } = await createPost(client);
      const { commentId } = await createComment(client, postId);
      try {
        await createTestClient(app)
          .delete(`/api/v1/posts/${postId}/comments/${commentId}`)
          .expect(401);
      } finally {
        await client.delete(`/api/v1/posts/${postId}`).expect(200);
      }
    });
  });

  // ─── 404 — Resource Not Found ──────────────────────────────────────────────

  describe('404 — Resource Not Found', () => {
    it('should return 404 when getting a non-existent post', async () => {
      await client.get(`/api/v1/posts/${randomUUID()}`).expect(404);
    });

    it('should return 404 when updating a non-existent post', async () => {
      await client.patch(`/api/v1/posts/${randomUUID()}`).send({ title: 'Ghost' }).expect(404);
    });

    it('should return 404 when deleting a non-existent post', async () => {
      await client.delete(`/api/v1/posts/${randomUUID()}`).expect(404);
    });

    it('should return 404 when listing comments on a non-existent post', async () => {
      await client.get(`/api/v1/posts/${randomUUID()}/comments`).expect(404);
    });

    it('should return 404 when creating a comment on a non-existent post', async () => {
      await client
        .post(`/api/v1/posts/${randomUUID()}/comments`)
        .send(createCommentRequestFactory())
        .expect(404);
    });

    it('should return 404 when deleting a non-existent comment', async () => {
      const { postId } = await createPost(client);
      try {
        await client.delete(`/api/v1/posts/${postId}/comments/${randomUUID()}`).expect(404);
      } finally {
        await client.delete(`/api/v1/posts/${postId}`).expect(200);
      }
    });

    it('should return 404 after a post has been deleted', async () => {
      const { postId } = await createPost(client);
      await client.delete(`/api/v1/posts/${postId}`).expect(200);
      await client.get(`/api/v1/posts/${postId}`).expect(404);
    });

    it('should return 404 after a comment has been deleted', async () => {
      const { postId } = await createPost(client);
      try {
        const { commentId } = await createComment(client, postId);
        const deleteRes = await client
          .delete(`/api/v1/posts/${postId}/comments/${commentId}`)
          .expect(200);
        expect((deleteRes.body as ActionSuccessWebResponse).success).toBe(true);
        // Second delete → 404
        await client.delete(`/api/v1/posts/${postId}/comments/${commentId}`).expect(404);
      } finally {
        await client.delete(`/api/v1/posts/${postId}`).expect(200);
      }
    });
  });

  // ─── 409 — Conflict ────────────────────────────────────────────────────────

  describe('409 — Conflict', () => {
    it('should return 409 when creating a post with a duplicate title', async () => {
      const { postId, dto } = await createPost(client);
      try {
        await client.post('/api/v1/posts').send(dto).expect(409);
      } finally {
        await client.delete(`/api/v1/posts/${postId}`).expect(200);
      }
    });

    it('should return 409 when updating a post to an already-existing title', async () => {
      const [{ postId: idA, dto: dtoA }, { postId: idB }] = await Promise.all([
        createPost(client),
        createPost(client),
      ]);
      try {
        await client.patch(`/api/v1/posts/${idB}`).send({ title: dtoA.title }).expect(409);
      } finally {
        await Promise.all([
          client.delete(`/api/v1/posts/${idA}`).expect(200),
          client.delete(`/api/v1/posts/${idB}`).expect(200),
        ]);
      }
    });
  });

  // ─── 400 — Validation Errors ───────────────────────────────────────────────

  describe('400 — Validation Errors', () => {
    it('should return 400 when creating a post with no body', async () => {
      await client.post('/api/v1/posts').send({}).expect(400);
    });

    it('should return 400 when creating a post with missing title', async () => {
      await client.post('/api/v1/posts').send({ content: 'Valid content.' }).expect(400);
    });

    it('should return 400 when creating a post with missing content', async () => {
      await client.post('/api/v1/posts').send({ title: 'A valid title' }).expect(400);
    });

    it('should return 400 when creating a comment with no body', async () => {
      const { postId } = await createPost(client);
      try {
        await client.post(`/api/v1/posts/${postId}/comments`).send({}).expect(400);
      } finally {
        await client.delete(`/api/v1/posts/${postId}`).expect(200);
      }
    });

    it('should return 400 when creating a comment with missing content', async () => {
      const { postId } = await createPost(client);
      try {
        await client
          .post(`/api/v1/posts/${postId}/comments`)
          .send({ extraField: 'ignored' })
          .expect(400);
      } finally {
        await client.delete(`/api/v1/posts/${postId}`).expect(200);
      }
    });

    it('should return 400 when listing posts with invalid pagination params', async () => {
      await client.get('/api/v1/posts').query({ page: 'abc', limit: -1 }).expect(400);
    });

    it('should return 400 when listing comments with invalid pagination params', async () => {
      const { postId } = await createPost(client);
      try {
        await client
          .get(`/api/v1/posts/${postId}/comments`)
          .query({ page: 'not-a-number', limit: 0 })
          .expect(400);
      } finally {
        await client.delete(`/api/v1/posts/${postId}`).expect(200);
      }
    });
  });

  // ─── 403 — Forbidden ───────────────────────────────────────────────────────

  describe('403 — Forbidden', () => {
    it('should return 403 when updating a post created by another user', async () => {
      const user1 = await createTestClient(app).login({
        id: randomUUID(),
        role: UserRoles.VOLUNTEER,
      });
      const user2 = await createTestClient(app).login({
        id: randomUUID(),
        role: UserRoles.VOLUNTEER,
      });

      const { postId } = await createPost(user1);
      try {
        await user2.patch(`/api/v1/posts/${postId}`).send({ title: 'Hacked Title' }).expect(403);
      } finally {
        await user1.delete(`/api/v1/posts/${postId}`).expect(200);
      }
    });

    it('should return 403 when deleting a post created by another user', async () => {
      const user1 = await createTestClient(app).login({
        id: randomUUID(),
        role: UserRoles.VOLUNTEER,
      });
      const user2 = await createTestClient(app).login({
        id: randomUUID(),
        role: UserRoles.VOLUNTEER,
      });

      const { postId } = await createPost(user1);
      try {
        await user2.delete(`/api/v1/posts/${postId}`).expect(403);
      } finally {
        await user1.delete(`/api/v1/posts/${postId}`).expect(200);
      }
    });

    it('should return 403 when deleting a comment created by another user', async () => {
      const user1 = await createTestClient(app).login({
        id: randomUUID(),
        role: UserRoles.VOLUNTEER,
      });
      const user2 = await createTestClient(app).login({
        id: randomUUID(),
        role: UserRoles.VOLUNTEER,
      });

      const { postId } = await createPost(user1);
      const { commentId } = await createComment(user1, postId);
      try {
        await user2.delete(`/api/v1/posts/${postId}/comments/${commentId}`).expect(403);
      } finally {
        await user1.delete(`/api/v1/posts/${postId}`).expect(200);
      }
    });
  });

  // ─── Full Error Scenario ────────────────────────────────────────────────────

  describe('End-to-End Error Scenario', () => {
    it('should handle a complete post+comment lifecycle including all error cases', async () => {
      const userClient = await createTestClient(app).login({
        id: randomUUID(),
        role: UserRoles.ADMIN,
      });

      // 1. Bad payload → 400
      await userClient.post('/api/v1/posts').send({}).expect(400);

      // 2. Valid post → 201
      const { postId, dto } = await createPost(userClient);
      expect(postId).toBeDefined();

      // 3. Duplicate title → 409
      await userClient.post('/api/v1/posts').send(dto).expect(409);

      // 4. Get post → 200
      const getRes = await userClient.get(`/api/v1/posts/${postId}`).expect(200);
      expect((getRes.body as PostWebResponse).post.id).toBe(postId);

      // 5. Non-existent post → 404
      await userClient.get(`/api/v1/posts/${randomUUID()}`).expect(404);

      // 6. Comment with no body → 400
      await userClient.post(`/api/v1/posts/${postId}/comments`).send({}).expect(400);

      // 7. Comment on non-existent post → 404
      await userClient
        .post(`/api/v1/posts/${randomUUID()}/comments`)
        .send(createCommentRequestFactory())
        .expect(404);

      // 8. Valid comment → 201
      const { commentId } = await createComment(userClient, postId);
      expect(commentId).toBeDefined();

      // 9. List comments → 200
      const listRes = await userClient
        .get(`/api/v1/posts/${postId}/comments`)
        .query({ page: 1, limit: 10 })
        .expect(200);
      expect((listRes.body as ListCommentsWebResponse).comments.length).toBeGreaterThanOrEqual(1);

      // 10. Delete non-existent comment → 404
      await userClient.delete(`/api/v1/posts/${postId}/comments/${randomUUID()}`).expect(404);

      // 11. Delete real comment → 200
      await userClient.delete(`/api/v1/posts/${postId}/comments/${commentId}`).expect(200);

      // 12. Delete same comment again → 404
      await userClient.delete(`/api/v1/posts/${postId}/comments/${commentId}`).expect(404);

      // 13. Delete post → 200
      await userClient.delete(`/api/v1/posts/${postId}`).expect(200);

      // 14. Post and comments are gone → 404
      await userClient.get(`/api/v1/posts/${postId}`).expect(404);
      await userClient.get(`/api/v1/posts/${postId}/comments`).expect(404);
    });
  });
});
