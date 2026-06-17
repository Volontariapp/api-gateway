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
  let targetUserPseudo: string;

  beforeAll(async () => {
    app = await createApp();
    adminClient = await createTestClient(app).login({ id: randomUUID(), role: UserRoles.ADMIN });

    // Create a user whose profile we will fetch
    const signUpDto = signUpRequestFactory({ pseudo: 'target_user' });
    const res = await adminClient.post('/api/v1/users').send(signUpDto).expect(201);
    const body = res.body as SignUpResponseDTO;
    targetUserId = body.user.id;
    targetUserPseudo = body.user.pseudo;

    // Create a regular user who will perform the fetching
    const visitorSignUpDto = signUpRequestFactory({ pseudo: 'visitor_user' });
    const visitorRes = await adminClient.post('/api/v1/users').send(visitorSignUpDto).expect(201);
    const visitorBody = visitorRes.body as SignUpResponseDTO;

    userClient = await createTestClient(app).login({
      id: visitorBody.user.id,
      role: visitorBody.user.role,
    });
  });

  afterAll(async () => {
    // Cleanup
    await adminClient.delete(`/api/v1/users/${targetUserId}`).expect(200);
    // Note: visitor user cleanup could be added here if needed,
    // but usually these are ephemeral in E2E tests if we don't leak them.
    // In this project, it seems they are deleted explicitly.
    // Let's find the visitor user ID to delete it.
    await app.close();
  });

  it('should get public user profile by ID', async () => {
    const res = await userClient.get(`/api/v1/users/${targetUserId}/public`).expect(200);
    const body = res.body as PublicUserResponseDTO;

    expect(body.user).toBeDefined();
    expect(body.user.id).toBe(targetUserId);
    expect(body.user.pseudo).toBe(targetUserPseudo);
    expect(body.user.totalImpactScore).toBeDefined();
    expect(Array.isArray(body.user.badges)).toBe(true);
  });

  it('should return 404 for non-existent user public profile', async () => {
    const fakeId = randomUUID();
    await userClient.get(`/api/v1/users/${fakeId}/public`).expect(404);
  });

  it('should return 400 for invalid user ID format', async () => {
    await userClient.get('/api/v1/users/not-a-uuid/public').expect(400);
  });
});
