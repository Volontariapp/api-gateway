import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createApp } from '../helpers/create-app.helper.js';
import { createTestClient } from '../helpers/test-client.helper.js';
import type {
  PostWebResponse,
  ListPostsWebResponse,
  ActionSuccessWebResponse,
  CommentWebResponse,
  ListCommentsWebResponse,
} from '@volontariapp/contracts';
import { UserRoles } from '@volontariapp/shared';
import { createPostRequestFactory, createCommentRequestFactory } from './post-test.factory.js';
import { assertIsoDate } from './post-test.helpers.js';

describe('Post Lifecycle (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── Post CRUD ────────────────────────────────────────────────────────────

  it('should cover post lifecycle: create, get, list, update, delete', async () => {
    const client = await createTestClient(app).login({ id: randomUUID(), role: UserRoles.ADMIN });
    const createDto = createPostRequestFactory();

    // 1. Create a post
    const createRes = await client.post('/api/v1/posts').send(createDto).expect(201);
    const createBody = createRes.body as PostWebResponse;
    const postId = createBody.post.id;
    expect(postId).toBeDefined();
    expect(createBody.post.title).toBe(createDto.title);
    expect(createBody.post.content).toBe(createDto.content);

    // 2. Conflict on creating a post with same title
    await client.post('/api/v1/posts').send(createDto).expect(409);

    // 3. Get the post
    const getRes = await client.get(`/api/v1/posts/${postId}`).expect(200);
    const getBody = getRes.body as PostWebResponse;
    expect(getBody.post.id).toBe(postId);
    expect(getBody.post.title).toBe(createDto.title);

    // 4. List posts and verify the new post is in the list
    const authorId = createBody.post.authorId;
    const listRes = await client.get('/api/v1/posts').query({ authorId }).expect(200);
    const listBody = listRes.body as ListPostsWebResponse;
    expect(listBody.posts.length).toBeGreaterThan(0);
    expect(listBody.posts.some((p) => p.id === postId)).toBe(true);

    // 5. Update the post
    const updateTitle = `${createDto.title}-Updated`;
    await client.patch(`/api/v1/posts/${postId}`).send({ title: updateTitle }).expect(200);

    const updatedRes = await client.get(`/api/v1/posts/${postId}`).expect(200);
    expect((updatedRes.body as PostWebResponse).post.title).toBe(updateTitle);

    // 6. Delete the post
    const deleteRes = await client.delete(`/api/v1/posts/${postId}`).expect(200);
    expect((deleteRes.body as ActionSuccessWebResponse).success).toBe(true);

    // 7. Get the deleted post → 404
    await client.get(`/api/v1/posts/${postId}`).expect(404);
  });

  it('should return 404 for operations on non-existent post', async () => {
    const client = await createTestClient(app).login({ id: randomUUID(), role: UserRoles.ADMIN });
    const fakeId = randomUUID();

    await client.get(`/api/v1/posts/${fakeId}`).expect(404);
    await client.patch(`/api/v1/posts/${fakeId}`).send({ title: 'New Title' }).expect(404);
    await client.delete(`/api/v1/posts/${fakeId}`).expect(404);
  });

  // ─── Post Pagination ───────────────────────────────────────────────────────

  it('should list and paginate multiple posts', async () => {
    const client = await createTestClient(app).login({ id: randomUUID(), role: UserRoles.ADMIN });

    const postIds: string[] = [];
    for (let i = 0; i < 15; i++) {
      const dto = createPostRequestFactory({
        title: `Pagination Test Post ${String(i)}-${randomUUID()}`,
      });
      const res = await client.post('/api/v1/posts').send(dto).expect(201);
      postIds.push((res.body as PostWebResponse).post.id);
    }

    try {
      const page1Res = await client.get('/api/v1/posts').query({ page: 1, limit: 10 }).expect(200);
      const page1Body = page1Res.body as ListPostsWebResponse;
      expect(page1Body.posts.length).toBeLessThanOrEqual(10);
      expect(page1Body.totalCount).toBeGreaterThanOrEqual(15);

      const page2Res = await client.get('/api/v1/posts').query({ page: 2, limit: 10 }).expect(200);
      const page2Body = page2Res.body as ListPostsWebResponse;
      expect(page2Body.posts.length).toBeGreaterThan(0);

      // No overlap between pages
      const page1Ids = new Set(page1Body.posts.map((p) => p.id));
      const overlap = page2Body.posts.some((p) => page1Ids.has(p.id));
      expect(overlap).toBe(false);
    } finally {
      await Promise.all(postIds.map((id) => client.delete(`/api/v1/posts/${id}`).expect(200)));
    }
  });

  // ─── Post Filtering ────────────────────────────────────────────────────────

  it('should filter posts by authorId', async () => {
    const userA = { id: randomUUID(), role: UserRoles.ADMIN };
    const userB = { id: randomUUID(), role: UserRoles.ADMIN };
    const clientA = await createTestClient(app).login(userA);
    const clientB = await createTestClient(app).login(userB);

    // User A creates a post
    const resA = await clientA
      .post('/api/v1/posts')
      .send(createPostRequestFactory({ title: `User A Post ${randomUUID()}` }))
      .expect(201);
    const postIdA = (resA.body as PostWebResponse).post.id;

    // User B creates a post
    const resB = await clientB
      .post('/api/v1/posts')
      .send(createPostRequestFactory({ title: `User B Post ${randomUUID()}` }))
      .expect(201);
    const postIdB = (resB.body as PostWebResponse).post.id;

    try {
      // Query posts for User A
      const listResA = await clientA.get('/api/v1/posts').query({ authorId: userA.id }).expect(200);
      const listBodyA = listResA.body as ListPostsWebResponse;

      const foundA = listBodyA.posts.some((p) => p.id === postIdA);
      const foundBInA = listBodyA.posts.some((p) => p.id === postIdB);

      expect(foundA).toBe(true);
      expect(foundBInA).toBe(false); // User B's post should NOT be returned

      // Query posts for User B
      const listResB = await clientB.get('/api/v1/posts').query({ authorId: userB.id }).expect(200);
      const listBodyB = listResB.body as ListPostsWebResponse;

      const foundB = listBodyB.posts.some((p) => p.id === postIdB);
      const foundAInB = listBodyB.posts.some((p) => p.id === postIdA);

      expect(foundB).toBe(true);
      expect(foundAInB).toBe(false); // User A's post should NOT be returned
    } finally {
      await clientA.delete(`/api/v1/posts/${postIdA}`).expect(200);
      await clientB.delete(`/api/v1/posts/${postIdB}`).expect(200);
    }
  });

  // ─── Comment Lifecycle ─────────────────────────────────────────────────────

  it('should cover comment lifecycle: create, list, paginate, delete', async () => {
    const client = await createTestClient(app).login({ id: randomUUID(), role: UserRoles.ADMIN });

    const postRes = await client
      .post('/api/v1/posts')
      .send(createPostRequestFactory({ title: `Post for Comments ${randomUUID()}` }))
      .expect(201);
    const postId = (postRes.body as PostWebResponse).post.id;

    const commentIds: string[] = [];
    for (let i = 0; i < 15; i++) {
      const dto = createCommentRequestFactory({
        content: `Pagination Test Comment ${String(i)}-${randomUUID()}`,
      });
      const res = await client.post(`/api/v1/posts/${postId}/comments`).send(dto).expect(201);
      commentIds.push((res.body as CommentWebResponse).id);
    }

    try {
      // Page 1
      const page1Res = await client
        .get(`/api/v1/posts/${postId}/comments`)
        .query({ page: 1, limit: 10 })
        .expect(200);
      const page1Body = page1Res.body as ListCommentsWebResponse;
      expect(page1Body.comments.length).toBeLessThanOrEqual(10);
      expect(page1Body.totalCount).toBeGreaterThanOrEqual(15);
      expect(page1Body.page).toBe(1);

      // Page 2
      const page2Res = await client
        .get(`/api/v1/posts/${postId}/comments`)
        .query({ page: 2, limit: 10 })
        .expect(200);
      const page2Body = page2Res.body as ListCommentsWebResponse;
      expect(page2Body.comments.length).toBeGreaterThan(0);
      expect(page2Body.page).toBe(2);

      // Delete a comment
      const commentToDelete = commentIds[0];
      const deleteRes = await client
        .delete(`/api/v1/posts/${postId}/comments/${commentToDelete}`)
        .expect(200);
      expect((deleteRes.body as ActionSuccessWebResponse).success).toBe(true);

      // Verify it's gone
      const afterDeleteRes = await client
        .get(`/api/v1/posts/${postId}/comments`)
        .query({ page: 1, limit: 15 })
        .expect(200);
      const afterDeleteBody = afterDeleteRes.body as ListCommentsWebResponse;
      expect(afterDeleteBody.comments.some((c) => c.id === commentToDelete)).toBe(false);
    } finally {
      await client.delete(`/api/v1/posts/${postId}`).expect(200);
    }
  });

  // ─── Date Format Validation ────────────────────────────────────────────────

  it('should return ISO 8601 dates (not timestamps) on post create & get', async () => {
    const client = await createTestClient(app).login({ id: randomUUID(), role: UserRoles.ADMIN });
    const dto = createPostRequestFactory();

    const createRes = await client.post('/api/v1/posts').send(dto).expect(201);
    const createBody = createRes.body as PostWebResponse;
    const postId = createBody.post.id;

    // Dates on create response
    assertIsoDate(createBody.post.createdAt, 'post.createdAt (create)');
    assertIsoDate(createBody.post.updatedAt, 'post.updatedAt (create)');

    try {
      // Dates on get response
      const getRes = await client.get(`/api/v1/posts/${postId}`).expect(200);
      const getBody = getRes.body as PostWebResponse;
      assertIsoDate(getBody.post.createdAt, 'post.createdAt (get)');
      assertIsoDate(getBody.post.updatedAt, 'post.updatedAt (get)');

      // Dates in list response
      const authorId = createBody.post.authorId;
      const listRes = await client
        .get('/api/v1/posts')
        .query({ page: 1, limit: 10, authorId })
        .expect(200);
      const listBody = listRes.body as ListPostsWebResponse;
      const found = listBody.posts.find((p) => p.id === postId);
      expect(found).toBeDefined();
      assertIsoDate(found?.createdAt, 'post.createdAt (list)');
      assertIsoDate(found?.updatedAt, 'post.updatedAt (list)');

      // updatedAt remains ISO after update
      await client
        .patch(`/api/v1/posts/${postId}`)
        .send({ title: `${dto.title}-v2` })
        .expect(200);
      const updatedRes = await client.get(`/api/v1/posts/${postId}`).expect(200);
      assertIsoDate(
        (updatedRes.body as PostWebResponse).post.updatedAt,
        'post.updatedAt (after update)',
      );
    } finally {
      await client.delete(`/api/v1/posts/${postId}`).expect(200);
    }
  });

  it('should return ISO 8601 dates (not timestamps) on comment create & list', async () => {
    const client = await createTestClient(app).login({ id: randomUUID(), role: UserRoles.ADMIN });

    const postRes = await client
      .post('/api/v1/posts')
      .send(createPostRequestFactory({ title: `Date-Check-Post-${randomUUID()}` }))
      .expect(201);
    const postId = (postRes.body as PostWebResponse).post.id;

    try {
      const commentRes = await client
        .post(`/api/v1/posts/${postId}/comments`)
        .send(createCommentRequestFactory())
        .expect(201);
      const commentBody = commentRes.body as CommentWebResponse;
      assertIsoDate(commentBody.createdAt, 'comment.createdAt (create)');
      assertIsoDate(commentBody.updatedAt, 'comment.updatedAt (create)');

      const listRes = await client
        .get(`/api/v1/posts/${postId}/comments`)
        .query({ page: 1, limit: 10 })
        .expect(200);
      const listBody = listRes.body as ListCommentsWebResponse;
      expect(listBody.comments.length).toBeGreaterThanOrEqual(1);

      for (const comment of listBody.comments) {
        assertIsoDate(comment.createdAt, `comment[${comment.id}].createdAt (list)`);
        assertIsoDate(comment.updatedAt, `comment[${comment.id}].updatedAt (list)`);
      }
    } finally {
      await client.delete(`/api/v1/posts/${postId}`).expect(200);
    }
  });
});
