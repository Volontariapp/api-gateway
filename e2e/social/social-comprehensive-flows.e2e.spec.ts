import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module.js';
import { GlobalExceptionFilter } from '@volontariapp/errors-nest';
import { randomUUID } from 'node:crypto';
import { loadConfig } from '@volontariapp/config';
import { CustomConfig } from '../../src/config/base-config.js';
import type { GetMyFollowsWebResponse } from '@volontariapp/contracts';
import type { ListUsersResponseDTO } from '../../src/modules/user/dto/response/list-users.response.dto.js';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setupAuth } from '../helpers/auth-helper.js';
import { createTestClient } from '../helpers/test-client.helper.js';
import { UserRoles } from '@volontariapp/shared';

describe('Social Comprehensive User Flows (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    const currentFileDir = dirname(fileURLToPath(import.meta.url));
    const configDir = join(currentFileDir, '../../config');
    const appConfig = loadConfig(configDir, CustomConfig);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule.register(appConfig)],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    setupAuth(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should process a complete self interaction flow (likes, follows)', async () => {
    const adminClient = await createTestClient(app).login({
      id: randomUUID(),
      role: UserRoles.ADMIN,
    });
    const userAId = randomUUID();
    const userBId = randomUUID();
    const postId = randomUUID();

    // 1. Admin creates nodes
    await adminClient.post(`/api/v1/social/users/${userAId}`).expect(201);
    await adminClient.post(`/api/v1/social/users/${userBId}`).expect(201);
    await adminClient.post(`/api/v1/social/posts/${postId}`).expect(201);

    // 2. User A logs in
    const userAClient = await createTestClient(app).login({
      id: userAId,
      role: UserRoles.VOLUNTEER,
    });

    // 3. User A likes post
    await userAClient.post(`/api/v1/social/likes/${postId}`).expect(201);
    // Conflict 409
    await userAClient.post(`/api/v1/social/likes/${postId}`).expect(409);

    // 4. User A fetches likes
    const likesRes = await userAClient.get('/api/v1/social/likes').expect(200);
    expect((likesRes.body as GetMyFollowsWebResponse).ids).toContain(postId);

    // 5. User A follows User B
    await userAClient.post(`/api/v1/social/follow/${userBId}`).expect(201);
    // Conflict 409
    await userAClient.post(`/api/v1/social/follow/${userBId}`).expect(409);

    // 6. User A fetches follows
    const followsRes = await userAClient.get('/api/v1/social/follows').expect(200);
    expect((followsRes.body as ListUsersResponseDTO).users.map((u) => u.id)).toContain(userBId);

    // User A fetches followers (should be empty for A)
    const followersRes = await userAClient.get('/api/v1/social/followers').expect(200);
    expect((followersRes.body as ListUsersResponseDTO).users.map((u) => u.id)).not.toContain(
      userBId,
    );

    // 7. User A unlikes post
    await userAClient.delete(`/api/v1/social/likes/${postId}`).expect(200);
    // Not found 404
    await userAClient.delete(`/api/v1/social/likes/${postId}`).expect(404);

    // 8. User A unfollows User B
    await userAClient.delete(`/api/v1/social/follow/${userBId}`).expect(200);
    // Not found 404
    await userAClient.delete(`/api/v1/social/follow/${userBId}`).expect(404);

    // 9. Admin cleans up
    await adminClient.delete(`/api/v1/social/users/${userAId}`).expect(200);
    await adminClient.delete(`/api/v1/social/users/${userBId}`).expect(200);
    await adminClient.delete(`/api/v1/social/posts/${postId}`).expect(200);
  });

  it('should process a complete self participation flow (events, wishes)', async () => {
    const adminClient = await createTestClient(app).login({
      id: randomUUID(),
      role: UserRoles.ADMIN,
    });
    const userId = randomUUID();
    const eventId = randomUUID();

    // 1. Admin creates nodes
    await adminClient.post(`/api/v1/social/users/${userId}`).expect(201);
    await adminClient.post(`/api/v1/social/events/${eventId}`).expect(201);

    // 2. User logs in
    const userClient = await createTestClient(app).login({ id: userId, role: UserRoles.VOLUNTEER });

    // 3. User participates
    await userClient.post(`/api/v1/social/events/${eventId}/participate`).expect(201);
    // Conflict 409
    await userClient.post(`/api/v1/social/events/${eventId}/participate`).expect(409);

    // 4. User fetches participations
    const partRes = await userClient.get('/api/v1/social/events/participated').expect(200);
    expect((partRes.body as GetMyFollowsWebResponse).ids).toContain(eventId);

    // 5. User wishes event
    await userClient.post(`/api/v1/social/events/${eventId}/wish`).expect(201);
    // Conflict 409
    await userClient.post(`/api/v1/social/events/${eventId}/wish`).expect(409);

    // 6. User fetches wishes
    const wishRes = await userClient.get('/api/v1/social/events/wished').expect(200);
    expect((wishRes.body as GetMyFollowsWebResponse).ids).toContain(eventId);

    // 7. User stops participating
    await userClient.delete(`/api/v1/social/events/${eventId}/participate`).expect(200);
    // Not found 404
    await userClient.delete(`/api/v1/social/events/${eventId}/participate`).expect(404);

    // 8. User removes wish
    await userClient.delete(`/api/v1/social/events/${eventId}/wish`).expect(200);
    // Not found 404
    await userClient.delete(`/api/v1/social/events/${eventId}/wish`).expect(404);

    // 9. Admin cleans up
    await adminClient.delete(`/api/v1/social/users/${userId}`).expect(200);
    await adminClient.delete(`/api/v1/social/events/${eventId}`).expect(200);
  });

  it('should process a complete self blocking flow', async () => {
    const adminClient = await createTestClient(app).login({
      id: randomUUID(),
      role: UserRoles.ADMIN,
    });
    const userAId = randomUUID();
    const userBId = randomUUID();

    await adminClient.post(`/api/v1/social/users/${userAId}`).expect(201);
    await adminClient.post(`/api/v1/social/users/${userBId}`).expect(201);

    const userAClient = await createTestClient(app).login({
      id: userAId,
      role: UserRoles.VOLUNTEER,
    });
    const userBClient = await createTestClient(app).login({
      id: userBId,
      role: UserRoles.VOLUNTEER,
    });

    // User A blocks User B
    await userAClient.post(`/api/v1/social/block/${userBId}`).expect(201);
    // Conflict 409
    await userAClient.post(`/api/v1/social/block/${userBId}`).expect(409);

    // User A fetches blocks
    const blocksRes = await userAClient.get('/api/v1/social/blocks').expect(200);
    expect((blocksRes.body as GetMyFollowsWebResponse).ids).toContain(userBId);

    // User B fetches who blocked them
    const whoRes = await userBClient.get('/api/v1/social/who-blocked-me').expect(200);
    expect((whoRes.body as GetMyFollowsWebResponse).ids).toContain(userAId);

    // User A unblocks User B
    await userAClient.delete(`/api/v1/social/block/${userBId}`).expect(200);
    // Not found 404
    await userAClient.delete(`/api/v1/social/block/${userBId}`).expect(404);

    await adminClient.delete(`/api/v1/social/users/${userAId}`).expect(200);
    await adminClient.delete(`/api/v1/social/users/${userBId}`).expect(200);
  });

  it('should enforce IsCurrentUserOrAdminGuard correctly on admin routes', async () => {
    const adminClient = await createTestClient(app).login({
      id: randomUUID(),
      role: UserRoles.ADMIN,
    });
    const userAId = randomUUID();
    const userBId = randomUUID();
    const postId = randomUUID();

    // Setup
    await adminClient.post(`/api/v1/social/users/${userAId}`).expect(201);
    await adminClient.post(`/api/v1/social/users/${userBId}`).expect(201);
    await adminClient.post(`/api/v1/social/posts/${postId}`).expect(201);

    // Give User B a like (so we have something to fetch)
    await adminClient.post(`/api/v1/social/users/${userBId}/likes/${postId}`).expect(201);

    const userAClient = await createTestClient(app).login({
      id: userAId,
      role: UserRoles.VOLUNTEER,
    });

    // User A accessing User A's explicit routes (forbidden 403 - regular users must use /social/likes)
    await userAClient.get(`/api/v1/social/users/${userAId}/likes`).expect(403);

    // User A accessing User B's explicit routes (forbidden 403)
    await userAClient.get(`/api/v1/social/users/${userBId}/likes`).expect(403);
    await userAClient.post(`/api/v1/social/users/${userBId}/follow/${userAId}`).expect(403);
    await userAClient.delete(`/api/v1/social/users/${userBId}/likes/${postId}`).expect(403);

    // Admin accessing User B's explicit routes (allowed)
    await adminClient.get(`/api/v1/social/users/${userBId}/likes`).expect(200);

    // Cleanup
    await adminClient.delete(`/api/v1/social/users/${userBId}/likes/${postId}`).expect(200);
    await adminClient.delete(`/api/v1/social/users/${userAId}`).expect(200);
    await adminClient.delete(`/api/v1/social/users/${userBId}`).expect(200);
    await adminClient.delete(`/api/v1/social/posts/${postId}`).expect(200);
  });

  it('should process feed and ownership queries via self and admin routes', async () => {
    const adminClient = await createTestClient(app).login({
      id: randomUUID(),
      role: UserRoles.ADMIN,
    });
    const userId = randomUUID();
    const postId = randomUUID();

    await adminClient.post(`/api/v1/social/users/${userId}`).expect(201);
    await adminClient.post(`/api/v1/social/posts/${postId}`).expect(201);

    // Admin assigns post to user
    await adminClient.post(`/api/v1/social/users/${userId}/posts/${postId}/own`).expect(201);

    const userClient = await createTestClient(app).login({ id: userId, role: 'user' });

    // Fetch via self route
    const selfPostsRes = await userClient.get('/api/v1/social/posts/me').expect(200);
    expect((selfPostsRes.body as GetMyFollowsWebResponse).ids).toContain(postId);

    // Fetch via explicit admin route
    const adminPostsRes = await adminClient.get(`/api/v1/social/users/${userId}/posts`).expect(200);
    expect((adminPostsRes.body as GetMyFollowsWebResponse).ids).toContain(postId);

    // Fetch feed (should be 200)
    await userClient.get('/api/v1/social/feed/me').expect(200);
    await adminClient.get(`/api/v1/social/users/${userId}/feed`).expect(200);

    // Cleanup
    await adminClient.delete(`/api/v1/social/users/${userId}/posts/${postId}/own`).expect(200);
    await adminClient.delete(`/api/v1/social/users/${userId}`).expect(200);
    await adminClient.delete(`/api/v1/social/posts/${postId}`).expect(200);
  });
});
