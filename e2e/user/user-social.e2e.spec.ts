import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module.js';
import { GlobalExceptionFilter } from '@volontariapp/errors-nest';
import { randomUUID } from 'node:crypto';
import { loadConfig } from '@volontariapp/config';
import { CustomConfig } from '../../src/config/base-config.js';
import { UserRoles } from '@volontariapp/shared';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setupAuth } from '../helpers/auth-helper.js';
import type { TestClient } from '../helpers/test-client.helper.js';
import { createTestClient } from '../helpers/test-client.helper.js';
import type { ListUsersPublicResponseDTO } from '../../src/modules/user/dto/response/index.js';
import { signUpRequestFactory } from './user-test.factory.js';
import type { SignUpResponseDTO } from '../../src/modules/user/dto/response/sign-up.response.dto.js';

describe('User Social Endpoints (E2E)', () => {
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

  it('should fetch event participants - comprehensive scenario', async () => {
    const adminClient = await createTestClient(app).login({
      id: randomUUID(),
      role: UserRoles.ADMIN,
    });

    // 1. Create a real user in ms-user
    const signUpDto = signUpRequestFactory();
    const signUpRes = await adminClient.post('/api/v1/users').send(signUpDto).expect(201);
    const userId = (signUpRes.body as SignUpResponseDTO).user.id;

    // 2. Create nodes in ms-social
    const eventId = randomUUID();
    await adminClient.post(`/api/v1/social/users/${userId}`).expect(201);
    await adminClient.post(`/api/v1/social/events/${eventId}`).expect(201);

    // 3. User participates in the event
    const userClient = await createTestClient(app).login({ id: userId, role: UserRoles.VOLUNTEER });
    await userClient.post(`/api/v1/social/events/${eventId}/participate`).expect(201);

    // 4. Fetch the participants! It should return the user's real profile
    const res = await userClient.get(`/api/v1/users/event/${eventId}/participants`).expect(200);
    const body = res.body as ListUsersPublicResponseDTO;
    expect(body).toHaveProperty('users');
    expect(Array.isArray(body.users)).toBe(true);
    expect(body.users.length).toBeGreaterThan(0);
    expect(body.users.map((u) => u.id)).toContain(userId);

    // Cleanup
    await adminClient.delete(`/api/v1/social/users/${userId}`).expect(200);
    await adminClient.delete(`/api/v1/social/events/${eventId}`).expect(200);
    await adminClient.delete(`/api/v1/users/${userId}`).expect(200);
  });

  it('should fetch post likers - comprehensive scenario', async () => {
    const adminClient = await createTestClient(app).login({
      id: randomUUID(),
      role: UserRoles.ADMIN,
    });

    // 1. Create a real user in ms-user
    const signUpDto = signUpRequestFactory();
    const signUpRes = await adminClient.post('/api/v1/users').send(signUpDto).expect(201);
    const userId = (signUpRes.body as SignUpResponseDTO).user.id;

    // 2. Create nodes in ms-social
    const postId = randomUUID();
    await adminClient.post(`/api/v1/social/users/${userId}`).expect(201);
    await adminClient.post(`/api/v1/social/posts/${postId}`).expect(201);

    // 3. User likes the post
    const userClient = await createTestClient(app).login({ id: userId, role: UserRoles.VOLUNTEER });
    await userClient.post(`/api/v1/social/likes/${postId}`).expect(201);

    // 4. Fetch the likers! It should return the user's real profile
    const res = await userClient.get(`/api/v1/users/post/${postId}/likers`).expect(200);
    const body = res.body as ListUsersPublicResponseDTO;
    expect(body).toHaveProperty('users');
    expect(Array.isArray(body.users)).toBe(true);
    expect(body.users.length).toBeGreaterThan(0);
    expect(body.users.map((u) => u.id)).toContain(userId);

    // Cleanup
    await adminClient.delete(`/api/v1/social/users/${userId}`).expect(200);
    await adminClient.delete(`/api/v1/social/posts/${postId}`).expect(200);
    await adminClient.delete(`/api/v1/users/${userId}`).expect(200);
  });

  describe('Edge cases and error handling', () => {
    let client: TestClient;

    beforeAll(async () => {
      client = await createTestClient(app).login({ id: randomUUID(), role: UserRoles.VOLUNTEER });
    });

    it('should return empty list when event has no participants', async () => {
      const eventId = randomUUID();
      // Even if event node doesn't exist, social returns empty list
      const res = await client.get(`/api/v1/users/event/${eventId}/participants`).expect(200);
      const body = res.body as ListUsersPublicResponseDTO;
      expect(body.users).toHaveLength(0);
    });

    it('should return empty list when post has no likers', async () => {
      const postId = randomUUID();
      const res = await client.get(`/api/v1/users/post/${postId}/likers`).expect(200);
      const body = res.body as ListUsersPublicResponseDTO;
      expect(body.users).toHaveLength(0);
    });

    it('should reject requests without authentication for event participants', async () => {
      const unauthClient = createTestClient(app);
      await unauthClient.get(`/api/v1/users/event/${randomUUID()}/participants`).expect(401);
    });

    it('should reject requests without authentication for post likers', async () => {
      const unauthClient = createTestClient(app);
      await unauthClient.get(`/api/v1/users/post/${randomUUID()}/likers`).expect(401);
    });

    it('should support pagination on participants', async () => {
      const eventId = randomUUID();
      const res = await client
        .get(`/api/v1/users/event/${eventId}/participants`)
        .query({ skip: 0, limit: 10 })
        .expect(200);

      const body = res.body as ListUsersPublicResponseDTO;
      expect(body.pagination.limit).toBe(10);
      expect(body.pagination.page).toBe(1);
      expect(body.pagination.total).toBe(0);
    });
  });
});
