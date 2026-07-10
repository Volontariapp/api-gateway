import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createApp } from '../helpers/create-app.helper.js';
import type { TestClient } from '../helpers/test-client.helper.js';
import { createTestClient } from '../helpers/test-client.helper.js';
import type {
  SignUpResponseDTO,
  PublicUserResponseDTO,
} from '../../src/modules/user/dto/response/index.js';
import { signUpRequestFactory } from './user-test.factory.js';
import { UserRoles } from '@volontariapp/shared';

describe('User Public Profile (E2E)', () => {
  let app: INestApplication;
  let adminClient: TestClient;
  let userClient: TestClient;
  let targetUserId: string;
  let visitorUserId: string;
  let targetUserPseudo: string;

  beforeAll(async () => {
    app = await createApp();
    const client = createTestClient(app);
    adminClient = await createTestClient(app).login({ id: randomUUID(), role: UserRoles.ADMIN });

    // 1. Create target user (the one whose profile we will fetch)
    const targetDto = signUpRequestFactory();
    const targetRes = await client.post('/api/v1/users').send(targetDto).expect(201);
    const targetBody = targetRes.body as SignUpResponseDTO;
    targetUserId = targetBody.user.id;
    targetUserPseudo = targetBody.user.pseudo;

    // 2. Create visitor user (the one who will perform the fetching)
    const visitorDto = signUpRequestFactory();
    const visitorRes = await client.post('/api/v1/users').send(visitorDto).expect(201);
    const visitorBody = visitorRes.body as SignUpResponseDTO;
    visitorUserId = visitorBody.user.id;

    userClient = await createTestClient(app).login({
      id: visitorBody.user.id,
      role: visitorBody.user.role,
    });
  });

  afterAll(async () => {
    // Cleanup both users using admin privileges
    if (targetUserId) {
      await adminClient.delete(`/api/v1/users/${targetUserId}`).expect(200);
    }
    if (visitorUserId) {
      await adminClient.delete(`/api/v1/users/${visitorUserId}`).expect(200);
    }
    await app.close();
  });

  it('should get public user profile by ID', async () => {
    const res = await userClient.get(`/api/v1/users/${targetUserId}/public`).expect(200);
    const body = res.body as PublicUserResponseDTO;

    expect(body).toBeDefined();
    expect(body.user.id).toBe(targetUserId);
    expect(body.user.pseudo).toBe(targetUserPseudo);
    expect(body.user.totalImpactScore).toBeDefined();
    expect(Array.isArray(body.user.badges)).toBe(true);

    // Verify sensitive data is NOT returned
    const rawUser = body.user as unknown as Record<string, unknown>;
    expect(rawUser.email).toBeUndefined();
    expect(rawUser.password).toBeUndefined();
    expect(rawUser.phoneNumber).toBeUndefined();
    expect(rawUser.role).toBeUndefined();
    expect(rawUser.dateOfBirth).toBeUndefined();
    expect(rawUser.lastLoginAt).toBeUndefined();
    expect(rawUser.status).toBeUndefined();
  });

  it('should return 404 for non-existent user public profile', async () => {
    const fakeId = randomUUID();
    await userClient.get(`/api/v1/users/${fakeId}/public`).expect(404);
  });
});
