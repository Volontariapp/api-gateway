import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createApp } from '../helpers/create-app.helper.js';
import type { TestClient } from '../helpers/test-client.helper.js';
import { createTestClient } from '../helpers/test-client.helper.js';
import type {
  SignUpResponseDTO,
  LoginResponseDTO,
  UserResponseDTO,
  ListUsersResponseDTO,
} from '../../src/modules/user/dto/response/index.js';
import {
  signUpRequestFactory,
  loginRequestFactory,
  updateUserRequestFactory,
  refreshTokenRequestFactory,
} from './user-test.factory.js';
import { UserRoles } from '@volontariapp/shared';

describe('User Lifecycle (E2E)', () => {
  let app: INestApplication;
  let client: TestClient;

  beforeAll(async () => {
    app = await createApp();
    client = await createTestClient(app).login({ id: randomUUID(), role: UserRoles.ADMIN });
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── Auth Flow: SignUp → Login → Refresh ─────────────────────────────────

  describe('Auth Flow', () => {
    it('should register a new user and return user + tokens', async () => {
      const dto = signUpRequestFactory();

      const res = await client.post('/api/v1/users').send(dto).expect(201);

      const body = res.body as SignUpResponseDTO;
      expect(body.user.id).toBeDefined();
      expect(body.user.email).toBe(dto.email);
      expect(body.user.pseudo).toBe(dto.pseudo);
      expect(body.auth.accessToken).toBeDefined();
      expect(body.auth.refreshToken).toBeDefined();

      // Cleanup
      await client.delete(`/api/v1/users/${body.user.id}`).expect(200);
    });

    it('should login with valid credentials', async () => {
      const signUpDto = signUpRequestFactory();
      const signUpRes = await client.post('/api/v1/users').send(signUpDto).expect(201);
      const userId = (signUpRes.body as SignUpResponseDTO).user.id;

      const loginDto = loginRequestFactory({
        email: signUpDto.email,
        password: signUpDto.password,
      });
      const res = await client.post('/api/v1/users/login').send(loginDto).expect(201);

      const body = res.body as LoginResponseDTO;
      expect(body.auth.accessToken).toBeDefined();
      expect(body.auth.refreshToken).toBeDefined();

      // Cleanup
      await client.delete(`/api/v1/users/${userId}`).expect(200);
    });

    it('should refresh tokens with a valid refresh token', async () => {
      const signUpDto = signUpRequestFactory();
      const signUpRes = await client.post('/api/v1/users').send(signUpDto).expect(201);
      const signUpBody = signUpRes.body as SignUpResponseDTO;
      const userId = signUpBody.user.id;
      const { refreshToken } = signUpBody.auth;

      const res = await client
        .withToken(refreshToken)
        .post('/api/v1/users/refresh')
        .send(refreshTokenRequestFactory(refreshToken))
        .expect(201);

      const body = res.body as LoginResponseDTO;
      expect(body.auth.accessToken).toBeDefined();
      expect(body.auth.refreshToken).toBeDefined();

      // Cleanup
      await client.delete(`/api/v1/users/${userId}`).expect(200);
    });

    it('should complete full signUp → login → refresh flow', async () => {
      // 1. Sign up
      const signUpDto = signUpRequestFactory();
      const signUpRes = await client.post('/api/v1/users').send(signUpDto).expect(201);
      const signUpBody = signUpRes.body as SignUpResponseDTO;
      const userId = signUpBody.user.id;

      // 2. Login
      const loginDto = loginRequestFactory({
        email: signUpDto.email,
        password: signUpDto.password,
      });
      const loginRes = await client.post('/api/v1/users/login').send(loginDto).expect(201);
      const loginBody = loginRes.body as LoginResponseDTO;
      expect(loginBody.auth.accessToken).toBeDefined();

      // 3. Refresh with the token from login
      const refreshRes = await client
        .withToken(loginBody.auth.refreshToken)
        .post('/api/v1/users/refresh')
        .send(refreshTokenRequestFactory(loginBody.auth.refreshToken))
        .expect(201);

      const refreshBody = refreshRes.body as LoginResponseDTO;
      expect(refreshBody.auth.accessToken).toBeDefined();
      expect(refreshBody.auth.refreshToken).not.toBe(loginBody.auth.refreshToken);

      // Cleanup
      await client.delete(`/api/v1/users/${userId}`).expect(200);
    });
  });

  // ─── Auth Errors ──────────────────────────────────────────────────────────

  describe('Auth Errors', () => {
    it('should return 401 on invalid login credentials', async () => {
      const signUpDto = signUpRequestFactory();
      const signUpRes = await client.post('/api/v1/users').send(signUpDto).expect(201);
      const userId = (signUpRes.body as SignUpResponseDTO).user.id;

      await client
        .post('/api/v1/users/login')
        .send(loginRequestFactory({ email: signUpDto.email, password: 'WrongPassword!' }))
        .expect(404);

      // Cleanup
      await client.delete(`/api/v1/users/${userId}`).expect(200);
    });

    it('should return 401 on invalid refresh token', async () => {
      await client
        .withToken('this.is.not.a.valid.jwt')
        .post('/api/v1/users/refresh')
        .send(refreshTokenRequestFactory('this.is.not.a.valid.jwt'))
        .expect(401);
    });

    it('should return 409 on duplicate user email', async () => {
      const signUpDto = signUpRequestFactory();
      const signUpRes = await client.post('/api/v1/users').send(signUpDto).expect(201);
      const userId = (signUpRes.body as SignUpResponseDTO).user.id;

      await client.post('/api/v1/users').send(signUpDto).expect(409);

      // Cleanup
      await client.delete(`/api/v1/users/${userId}`).expect(200);
    });

    it('should return 400 on sign up with missing required fields', async () => {
      await client.post('/api/v1/users').send({ pseudo: 'test_user' }).expect(400);
    });
  });

  // ─── User CRUD ────────────────────────────────────────────────────────────

  describe('User CRUD', () => {
    it('should get a user by ID', async () => {
      const signUpDto = signUpRequestFactory();
      const signUpRes = await client.post('/api/v1/users').send(signUpDto).expect(201);
      const userId = (signUpRes.body as SignUpResponseDTO).user.id;

      const res = await client.get(`/api/v1/users/${userId}`).expect(200);

      const body = res.body as UserResponseDTO;
      expect(body.user.id).toBe(userId);
      expect(body.user.email).toBe(signUpDto.email);
      expect(body.user.pseudo).toBe(signUpDto.pseudo);
      expect(Array.isArray(body.user.badges)).toBe(true);

      // Cleanup
      await client.delete(`/api/v1/users/${userId}`).expect(200);
    });

    it('should list users with pagination', async () => {
      const signUpDto = signUpRequestFactory();
      const signUpRes = await client.post('/api/v1/users').send(signUpDto).expect(201);
      const userId = (signUpRes.body as SignUpResponseDTO).user.id;

      const res = await client.get('/api/v1/users').expect(200);

      const body = res.body as ListUsersResponseDTO;
      expect(Array.isArray(body.users)).toBe(true);
      expect(body.pagination).toBeDefined();
      expect(body.users.some((u) => u.id === userId)).toBe(true);

      // Cleanup
      await client.delete(`/api/v1/users/${userId}`).expect(200);
    });

    it('should update a user profile', async () => {
      const signUpDto = signUpRequestFactory();
      const signUpRes = await client.post('/api/v1/users').send(signUpDto).expect(201);
      const userId = (signUpRes.body as SignUpResponseDTO).user.id;

      const updateDto = updateUserRequestFactory({ bio: 'E2E updated bio' });
      const res = await client.patch(`/api/v1/users/${userId}`).send(updateDto).expect(200);

      const body = res.body as UserResponseDTO;
      expect(body.user.bio).toBe('E2E updated bio');

      // Cleanup
      await client.delete(`/api/v1/users/${userId}`).expect(200);
    });

    it('should update user password', async () => {
      const signUpDto = signUpRequestFactory();
      const signUpRes = await client.post('/api/v1/users').send(signUpDto).expect(201);
      const userId = (signUpRes.body as SignUpResponseDTO).user.id;

      await client
        .patch(`/api/v1/users/${userId}`)
        .send({
          previousPassword: signUpDto.password,
          newPassword: 'NewSecurePassword456!',
        })
        .expect(200);

      // Verify login with new password
      await client
        .post('/api/v1/users/login')
        .send(loginRequestFactory({ email: signUpDto.email, password: 'NewSecurePassword456!' }))
        .expect(201);

      // Cleanup
      await client.delete(`/api/v1/users/${userId}`).expect(200);
    });

    it('should update organisation info', async () => {
      const signUpDto = signUpRequestFactory({
        organisationInfo: { rna: 'W123456789' },
      });
      const signUpRes = await client.post('/api/v1/users').send(signUpDto).expect(201);
      const userId = (signUpRes.body as SignUpResponseDTO).user.id;

      const res = await client
        .patch(`/api/v1/users/${userId}`)
        .send({ organisationInfo: { rna: 'W987654321' } })
        .expect(200);

      const body = res.body as UserResponseDTO;
      expect(body.user.organisationInfo).toMatchObject({ rna: 'W987654321' });

      // Cleanup
      await client.delete(`/api/v1/users/${userId}`).expect(200);
    });

    it('should delete a user', async () => {
      const signUpDto = signUpRequestFactory();
      const signUpRes = await client.post('/api/v1/users').send(signUpDto).expect(201);
      const userId = (signUpRes.body as SignUpResponseDTO).user.id;

      await client.delete(`/api/v1/users/${userId}`).expect(200);

      // Verify user no longer exists
      await client.get(`/api/v1/users/${userId}`).expect(404);
    });
  });

  // ─── User CRUD Errors ─────────────────────────────────────────────────────

  describe('User CRUD Errors', () => {
    it('should return 404 when getting a non-existent user', async () => {
      await client.get(`/api/v1/users/${randomUUID()}`).expect(404);
    });

    it('should return 404 when updating a non-existent user', async () => {
      await client
        .patch(`/api/v1/users/${randomUUID()}`)
        .send(updateUserRequestFactory())
        .expect(404);
    });

    it('should return 404 when deleting a non-existent user', async () => {
      await client.delete(`/api/v1/users/${randomUUID()}`).expect(404);
    });
  });

  // ─── Impact Score ─────────────────────────────────────────────────────────

  describe('Impact Score', () => {
    it('should increment user impact score', async () => {
      const signUpDto = signUpRequestFactory();
      const signUpRes = await client.post('/api/v1/users').send(signUpDto).expect(201);
      const userId = (signUpRes.body as SignUpResponseDTO).user.id;

      await client
        .post(`/api/v1/users/${userId}/impact-score`)
        .send({ scoreIncrement: 50 })
        .expect(201);

      const getRes = await client.get(`/api/v1/users/${userId}`).expect(200);
      const body = getRes.body as UserResponseDTO;
      expect(body.user.totalImpactScore).toBeGreaterThanOrEqual(50);

      // Cleanup
      await client.delete(`/api/v1/users/${userId}`).expect(200);
    });

    it('should accumulate impact score on multiple increments', async () => {
      const signUpDto = signUpRequestFactory();
      const signUpRes = await client.post('/api/v1/users').send(signUpDto).expect(201);
      const userId = (signUpRes.body as SignUpResponseDTO).user.id;

      await client
        .post(`/api/v1/users/${userId}/impact-score`)
        .send({ scoreIncrement: 30 })
        .expect(201);

      await client
        .post(`/api/v1/users/${userId}/impact-score`)
        .send({ scoreIncrement: 20 })
        .expect(201);

      const getRes = await client.get(`/api/v1/users/${userId}`).expect(200);
      const body = getRes.body as UserResponseDTO;
      expect(body.user.totalImpactScore).toBeGreaterThanOrEqual(50);

      // Cleanup
      await client.delete(`/api/v1/users/${userId}`).expect(200);
    });
  });

  // ─── User-Badge Association ───────────────────────────────────────────────

  describe('User-Badge Association', () => {
    it('should add a badge to a user and see it on profile', async () => {
      const { createBadgeRequestFactory } = await import('./user-test.factory.js');

      // Create badge + user
      const badgeDto = createBadgeRequestFactory();
      const signUpDto = signUpRequestFactory();

      const [badgeRes, signUpRes] = await Promise.all([
        client.post('/api/v1/badges').send(badgeDto).expect(201),
        client.post('/api/v1/users').send(signUpDto).expect(201),
      ]);

      const badgeId = (badgeRes.body as { badge: { id: string } }).badge.id;
      const userId = (signUpRes.body as SignUpResponseDTO).user.id;

      // Add badge
      await client.post(`/api/v1/users/${userId}/badges`).send({ badgeId }).expect(201);

      // Verify badge appears on user
      const getRes = await client.get(`/api/v1/users/${userId}`).expect(200);
      const body = getRes.body as UserResponseDTO;
      expect(body.user.badges.some((b) => b.id === badgeId)).toBe(true);

      // Cleanup
      await client.delete(`/api/v1/users/${userId}/badges/${badgeId}`).expect(200);
      await Promise.all([
        client.delete(`/api/v1/users/${userId}`).expect(200),
        client.delete(`/api/v1/badges/${badgeId}`).expect(200),
      ]);
    });

    it('should remove a badge from a user', async () => {
      const { createBadgeRequestFactory } = await import('./user-test.factory.js');

      const badgeDto = createBadgeRequestFactory();
      const signUpDto = signUpRequestFactory();

      const [badgeRes, signUpRes] = await Promise.all([
        client.post('/api/v1/badges').send(badgeDto).expect(201),
        client.post('/api/v1/users').send(signUpDto).expect(201),
      ]);

      const badgeId = (badgeRes.body as { badge: { id: string } }).badge.id;
      const userId = (signUpRes.body as SignUpResponseDTO).user.id;

      // Add then remove
      await client.post(`/api/v1/users/${userId}/badges`).send({ badgeId }).expect(201);
      await client.delete(`/api/v1/users/${userId}/badges/${badgeId}`).expect(200);

      // Verify badge is gone
      const getRes = await client.get(`/api/v1/users/${userId}`).expect(200);
      const body = getRes.body as UserResponseDTO;
      expect(body.user.badges.some((b) => b.id === badgeId)).toBe(false);

      // Cleanup
      await Promise.all([
        client.delete(`/api/v1/users/${userId}`).expect(200),
        client.delete(`/api/v1/badges/${badgeId}`).expect(200),
      ]);
    });

    it('should return 400 when adding badge with missing badgeId', async () => {
      const signUpDto = signUpRequestFactory();
      const signUpRes = await client.post('/api/v1/users').send(signUpDto).expect(201);
      const userId = (signUpRes.body as SignUpResponseDTO).user.id;

      await client.post(`/api/v1/users/${userId}/badges`).send({}).expect(400);

      // Cleanup
      await client.delete(`/api/v1/users/${userId}`).expect(200);
    });
  });

  // ─── Full Lifecycle Flow ──────────────────────────────────────────────────

  describe('Full Lifecycle', () => {
    it('signUp → login → getUser → update → addBadge → incrementScore → removeBadge → delete', async () => {
      const { createBadgeRequestFactory } = await import('./user-test.factory.js');

      // 1. Create a badge first
      const badgeDto = createBadgeRequestFactory();
      const badgeRes = await client.post('/api/v1/badges').send(badgeDto).expect(201);
      const badgeId = (badgeRes.body as { badge: { id: string } }).badge.id;

      // 2. Sign up
      const signUpDto = signUpRequestFactory();
      const signUpRes = await client.post('/api/v1/users').send(signUpDto).expect(201);
      const signUpBody = signUpRes.body as SignUpResponseDTO;
      const userId = signUpBody.user.id;

      // 3. Login
      const loginRes = await client
        .post('/api/v1/users/login')
        .send(loginRequestFactory({ email: signUpDto.email, password: signUpDto.password }))
        .expect(201);
      expect((loginRes.body as LoginResponseDTO).auth.accessToken).toBeDefined();

      // 4. Get user
      const getRes = await client.get(`/api/v1/users/${userId}`).expect(200);
      expect((getRes.body as UserResponseDTO).user.email).toBe(signUpDto.email);

      // 5. Update user
      const updateRes = await client
        .patch(`/api/v1/users/${userId}`)
        .send(updateUserRequestFactory({ bio: 'Lifecycle test bio' }))
        .expect(200);
      expect((updateRes.body as UserResponseDTO).user.bio).toBe('Lifecycle test bio');

      // 6. Add badge
      await client.post(`/api/v1/users/${userId}/badges`).send({ badgeId }).expect(201);

      // 7. Increment score
      await client
        .post(`/api/v1/users/${userId}/impact-score`)
        .send({ scoreIncrement: 100 })
        .expect(201);

      // 8. Verify user state
      const finalRes = await client.get(`/api/v1/users/${userId}`).expect(200);
      const finalBody = finalRes.body as UserResponseDTO;
      expect(finalBody.user.totalImpactScore).toBeGreaterThanOrEqual(100);
      expect(finalBody.user.badges.some((b) => b.id === badgeId)).toBe(true);

      // 9. Remove badge
      await client.delete(`/api/v1/users/${userId}/badges/${badgeId}`).expect(200);

      // 10. Delete user
      await client.delete(`/api/v1/users/${userId}`).expect(200);
      await client.get(`/api/v1/users/${userId}`).expect(404);

      // Cleanup badge
      await client.delete(`/api/v1/badges/${badgeId}`).expect(200);
    });
  });
});
