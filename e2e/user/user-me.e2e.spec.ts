import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createApp } from '../helpers/create-app.helper.js';
import type { TestClient } from '../helpers/test-client.helper.js';
import { createTestClient } from '../helpers/test-client.helper.js';
import type {
  SignUpResponseDTO,
  UserResponseDTO,
} from '../../src/modules/user/dto/response/index.js';
import { signUpRequestFactory, updateUserRequestFactory } from './user-test.factory.js';
import { UserRoles } from '@volontariapp/shared';

describe('User Me Endpoints (E2E)', () => {
  let app: INestApplication;
  let adminClient: TestClient;
  let userClient: TestClient;
  let userId: string;

  beforeAll(async () => {
    app = await createApp();
    adminClient = await createTestClient(app).login({ id: randomUUID(), role: UserRoles.ADMIN });

    // Create a regular user for testing
    const signUpDto = signUpRequestFactory();
    const res = await adminClient.post('/api/v1/users').send(signUpDto).expect(201);
    const body = res.body as SignUpResponseDTO;
    userId = body.user.id;

    userClient = await createTestClient(app).login({ id: body.user.id, role: body.user.role });
  });

  afterAll(async () => {
    // Cleanup
    await adminClient.delete(`/api/v1/users/${userId}`).expect(200);
    await app.close();
  });

  it('should get current user profile via /users/me', async () => {
    const res = await userClient.get('/api/v1/users/me').expect(200);
    const body = res.body as UserResponseDTO;
    expect(body.user.id).toBe(userId);
  });

  it('should update current user profile via /users/me', async () => {
    const updateDto = updateUserRequestFactory({ bio: 'Updated via /me' });
    const res = await userClient.patch('/api/v1/users/me').send(updateDto).expect(200);
    const body = res.body as UserResponseDTO;
    expect(body.user.bio).toBe('Updated via /me');
  });

  it('should not allow a regular user to access /users/:id', async () => {
    // Even their own ID should fail on the admin route
    await userClient.get(`/api/v1/users/${userId}`).expect(403);
    await userClient.patch(`/api/v1/users/${userId}`).send({}).expect(403);
  });

  it('should allow a regular user to delete themselves via /users/me', async () => {
    // First create another temporary user so we don't break the afterAll cleanup of the main test user
    const signUpDto = signUpRequestFactory();
    const signUpRes = await adminClient.post('/api/v1/users').send(signUpDto).expect(201);
    const tempUserId = (signUpRes.body as SignUpResponseDTO).user.id;
    const tempUserClient = createTestClient(app).withToken(
      (signUpRes.body as SignUpResponseDTO).auth.accessToken,
    );

    await tempUserClient.delete('/api/v1/users/me').expect(200);

    // Verify user no longer exists (using admin)
    await adminClient.get(`/api/v1/users/${tempUserId}`).expect(404);
  });
});
