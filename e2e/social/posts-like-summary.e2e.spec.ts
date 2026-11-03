/**
 * E2E Tests: POST /api/v1/social/likes-summary (batch read of like counts).
 *
 * ATTENTION: ce test ne peut passer en CI qu une fois ms-social deploye avec le RPC
 * InteractionQueryService.getPostsLikeSummary. Tant que ce n est pas le cas, la gateway
 * recoit UNIMPLEMENTED et le test echoue : ce n est pas une regression de la gateway.
 */

import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { UserRoles } from '@volontariapp/shared';
import type { GetPostsLikeSummaryResponse } from '@volontariapp/contracts';
import { createApp } from '../helpers/create-app.helper.js';
import { createTestClient } from '../helpers/test-client.helper.js';
import type { TestClient } from '../helpers/test-client.helper.js';

const SUMMARY_PATH = '/api/v1/social/likes-summary';

describe('Posts like summary (E2E)', () => {
  let app: INestApplication;
  let admin: TestClient;
  let user: TestClient;

  beforeAll(async () => {
    app = await createApp();
    admin = await createTestClient(app).login({ id: randomUUID(), role: UserRoles.ADMIN });
    const userId = randomUUID();
    await admin.post(`/api/v1/social/users/${userId}`);
    user = await createTestClient(app).login({ id: userId, role: UserRoles.VOLUNTEER });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return one entry per post with the like count and likedByMe', async () => {
    const likedPostId = randomUUID();
    const otherPostId = randomUUID();
    await admin.post(`/api/v1/social/posts/${likedPostId}`).expect(201);
    await admin.post(`/api/v1/social/posts/${otherPostId}`).expect(201);
    await user.post(`/api/v1/social/likes/${likedPostId}`).expect(201);

    const res = await user
      .post(SUMMARY_PATH)
      .send({ postIds: [likedPostId, otherPostId] })
      .expect(200);

    const { summaries } = res.body as GetPostsLikeSummaryResponse;
    expect(summaries).toHaveLength(2);
    expect(summaries.find((s) => s.postId === likedPostId)).toMatchObject({
      likeCount: 1,
      likedByMe: true,
    });
    expect(summaries.find((s) => s.postId === otherPostId)).toMatchObject({
      likeCount: 0,
      likedByMe: false,
    });
  });

  it('should reject an empty list, duplicates and more than 100 ids with 400', async () => {
    await user.post(SUMMARY_PATH).send({ postIds: [] }).expect(400);
    await user
      .post(SUMMARY_PATH)
      .send({ postIds: ['a', 'a'] })
      .expect(400);
    const tooMany = Array.from({ length: 101 }, () => randomUUID());
    await user.post(SUMMARY_PATH).send({ postIds: tooMany }).expect(400);
  });
});
