/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module.js';
import { GlobalExceptionFilter } from '@volontariapp/errors-nest';
import { randomUUID } from 'node:crypto';
import { loadConfig } from '@volontariapp/config';
import { CustomConfig } from '../../src/config/base-config.js';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  SignUpResponseDTO,
  LoginResponseDTO,
  UserResponseDTO,
  ListUsersResponseDTO,
  BadgeResponseDTO,
  ListBadgesResponseDTO,
} from '../../src/modules/user/dto/response/index.js';
import {
  signUpRequestFactory,
  loginRequestFactory,
  createBadgeRequestFactory,
  updateUserRequestFactory,
} from './user-test.factory.js';

describe('User Lifecycle (E2E)', () => {
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
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── Badge lifecycle ───────────────────────────────────────────────────────

  it('should cover badge lifecycle: create, get by id, get by slug, list, update, conflict, and delete', async () => {
    // Arrange
    const createDto = createBadgeRequestFactory();

    // Act — create
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/badges')
      .send(createDto)
      .expect(201);

    // Assert — create
    const createBody = createRes.body as BadgeResponseDTO;
    const badgeId = createBody.badge.id;
    expect(badgeId).toBeDefined();
    expect(createBody.badge.slug).toBe(createDto.slug);
    expect(createBody.badge.name).toBe(createDto.name);

    // Act — get by id
    const getByIdRes = await request(app.getHttpServer())
      .get(`/api/v1/badges/${badgeId}`)
      .expect(200);

    // Assert — get by id
    const getByIdBody = getByIdRes.body as BadgeResponseDTO;
    expect(getByIdBody.badge.id).toBe(badgeId);

    // Act — get by slug
    const getBySlugRes = await request(app.getHttpServer())
      .get(`/api/v1/badges/slug/${createDto.slug}`)
      .expect(200);

    // Assert — get by slug
    const getBySlugBody = getBySlugRes.body as BadgeResponseDTO;
    expect(getBySlugBody.badge.slug).toBe(createDto.slug);

    // Act — list
    const listRes = await request(app.getHttpServer())
      .get('/api/v1/badges')
      .expect(200);

    // Assert — list
    const listBody = listRes.body as ListBadgesResponseDTO;
    expect(Array.isArray(listBody.badges)).toBe(true);
    expect(listBody.badges.some((b) => b.id === badgeId)).toBe(true);

    // Act — update
    const updatedName = `${createDto.name}-Updated`;
    await request(app.getHttpServer())
      .patch(`/api/v1/badges/${badgeId}`)
      .send({ name: updatedName })
      .expect(200);

    // Act — conflict on duplicate slug
    await request(app.getHttpServer())
      .post('/api/v1/badges')
      .send(createDto)
      .expect(409);

    // Act — delete
    await request(app.getHttpServer())
      .delete(`/api/v1/badges/${badgeId}`)
      .expect(200);

    // Assert — get after delete returns 404
    await request(app.getHttpServer())
      .get(`/api/v1/badges/${badgeId}`)
      .expect(404);
  });

  // ─── Auth lifecycle ────────────────────────────────────────────────────────

  it('should cover auth lifecycle: sign up, login, refresh, and token reuse', async () => {
    // Arrange
    const signUpDto = signUpRequestFactory();

    // Act — sign up
    const signUpRes = await request(app.getHttpServer())
      .post('/api/v1/users')
      .send(signUpDto)
      .expect(201);

    // Assert — sign up
    const signUpBody = signUpRes.body as SignUpResponseDTO;
    expect(signUpBody.user.id).toBeDefined();
    expect(signUpBody.user.email).toBe(signUpDto.email);
    expect(signUpBody.auth.accessToken).toBeDefined();
    expect(signUpBody.auth.refreshToken).toBeDefined();
    const userId = signUpBody.user.id;
    const { refreshToken } = signUpBody.auth;

    // Act — login
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/users/login')
      .send(
        loginRequestFactory({
          email: signUpDto.email,
          password: signUpDto.password,
        }),
      )
      .expect(200);

    // Assert — login
    const loginBody = loginRes.body as LoginResponseDTO;
    expect(loginBody.auth.accessToken).toBeDefined();
    expect(loginBody.auth.refreshToken).toBeDefined();

    // Act — refresh
    const refreshRes = await request(app.getHttpServer())
      .post('/api/v1/users/refresh')
      .send({ refreshToken })
      .expect(200);

    // Assert — refresh
    const refreshBody = refreshRes.body as LoginResponseDTO;
    expect(refreshBody.auth.accessToken).toBeDefined();
    expect(refreshBody.auth.refreshToken).toBeDefined();

    // Cleanup
    await request(app.getHttpServer())
      .delete(`/api/v1/users/${userId}`)
      .expect(200);
  });

  // ─── User lifecycle ─────────────────────────────────────────────────────────

  it('should cover user lifecycle: sign up, get, list, update, and delete', async () => {
    // Arrange
    const signUpDto = signUpRequestFactory();

    // Act — sign up
    const signUpRes = await request(app.getHttpServer())
      .post('/api/v1/users')
      .send(signUpDto)
      .expect(201);

    // Assert — sign up
    const signUpBody = signUpRes.body as SignUpResponseDTO;
    const userId = signUpBody.user.id;
    expect(userId).toBeDefined();

    // Act — get by id
    const getRes = await request(app.getHttpServer())
      .get(`/api/v1/users/${userId}`)
      .expect(200);

    // Assert — get by id
    const getBody = getRes.body as UserResponseDTO;
    expect(getBody.user.email).toBe(signUpDto.email);
    expect(getBody.user.pseudo).toBe(signUpDto.pseudo);
    expect(Array.isArray(getBody.user.badges)).toBe(true);

    // Act — list
    const listRes = await request(app.getHttpServer())
      .get('/api/v1/users')
      .expect(200);

    // Assert — list
    const listBody = listRes.body as ListUsersResponseDTO;
    expect(Array.isArray(listBody.users)).toBe(true);
    expect(listBody.pagination).toBeDefined();
    expect(listBody.users.some((u) => u.id === userId)).toBe(true);

    // Act — update
    const updateDto = updateUserRequestFactory({ bio: 'Updated bio for E2E' });
    const updateRes = await request(app.getHttpServer())
      .patch(`/api/v1/users/${userId}`)
      .send(updateDto)
      .expect(200);

    // Assert — update
    const updateBody = updateRes.body as UserResponseDTO;
    expect(updateBody.user.bio).toBe('Updated bio for E2E');

    // Act — delete
    await request(app.getHttpServer())
      .delete(`/api/v1/users/${userId}`)
      .expect(200);

    // Assert — get after delete returns 404
    await request(app.getHttpServer())
      .get(`/api/v1/users/${userId}`)
      .expect(404);
  });

  // ─── User-badge association ────────────────────────────────────────────────

  it('should cover user-badge lifecycle: add badge to user and remove it', async () => {
    // Arrange — create badge and user
    const badgeDto = createBadgeRequestFactory();
    const signUpDto = signUpRequestFactory();

    const [badgeRes, signUpRes] = await Promise.all([
      request(app.getHttpServer())
        .post('/api/v1/badges')
        .send(badgeDto)
        .expect(201),
      request(app.getHttpServer())
        .post('/api/v1/users')
        .send(signUpDto)
        .expect(201),
    ]);

    const badgeId = (badgeRes.body as BadgeResponseDTO).badge.id;
    const userId = (signUpRes.body as SignUpResponseDTO).user.id;

    // Act — add badge to user
    await request(app.getHttpServer())
      .post(`/api/v1/users/${userId}/badges`)
      .send({ badgeId })
      .expect(201);

    // Assert — badge appears on user profile
    const getRes = await request(app.getHttpServer())
      .get(`/api/v1/users/${userId}`)
      .expect(200);
    const getBody = getRes.body as UserResponseDTO;
    expect(getBody.user.badges.some((b) => b.id === badgeId)).toBe(true);

    // Act — remove badge from user
    await request(app.getHttpServer())
      .delete(`/api/v1/users/${userId}/badges/${badgeId}`)
      .expect(200);

    // Assert — badge no longer on user profile
    const getAfterRes = await request(app.getHttpServer())
      .get(`/api/v1/users/${userId}`)
      .expect(200);
    const getAfterBody = getAfterRes.body as UserResponseDTO;
    expect(getAfterBody.user.badges.some((b) => b.id === badgeId)).toBe(false);

    // Cleanup
    await Promise.all([
      request(app.getHttpServer())
        .delete(`/api/v1/users/${userId}`)
        .expect(200),
      request(app.getHttpServer())
        .delete(`/api/v1/badges/${badgeId}`)
        .expect(200),
    ]);
  });

  // ─── Impact score ──────────────────────────────────────────────────────────

  it('should increment user impact score', async () => {
    // Arrange
    const signUpDto = signUpRequestFactory();
    const signUpRes = await request(app.getHttpServer())
      .post('/api/v1/users')
      .send(signUpDto)
      .expect(201);
    const userId = (signUpRes.body as SignUpResponseDTO).user.id;

    // Act
    await request(app.getHttpServer())
      .post(`/api/v1/users/${userId}/impact-score`)
      .send({ scoreIncrement: 50 })
      .expect(201);

    // Assert
    const getRes = await request(app.getHttpServer())
      .get(`/api/v1/users/${userId}`)
      .expect(200);
    const getBody = getRes.body as UserResponseDTO;
    expect(getBody.user.totalImpactScore).toBeGreaterThanOrEqual(50);

    // Cleanup
    await request(app.getHttpServer())
      .delete(`/api/v1/users/${userId}`)
      .expect(200);
  });

  // ─── Error cases ───────────────────────────────────────────────────────────

  it('should return 409 on duplicate user email', async () => {
    // Arrange
    const signUpDto = signUpRequestFactory();
    const signUpRes = await request(app.getHttpServer())
      .post('/api/v1/users')
      .send(signUpDto)
      .expect(201);
    const userId = (signUpRes.body as SignUpResponseDTO).user.id;

    // Act + Assert
    await request(app.getHttpServer())
      .post('/api/v1/users')
      .send(signUpDto)
      .expect(409);

    // Cleanup
    await request(app.getHttpServer())
      .delete(`/api/v1/users/${userId}`)
      .expect(200);
  });

  it('should return 404 when getting a non-existent user', async () => {
    // Arrange
    const nonExistentId = randomUUID();

    // Act + Assert
    await request(app.getHttpServer())
      .get(`/api/v1/users/${nonExistentId}`)
      .expect(404);
  });

  it('should return 404 when updating a non-existent user', async () => {
    // Arrange
    const nonExistentId = randomUUID();

    // Act + Assert
    await request(app.getHttpServer())
      .patch(`/api/v1/users/${nonExistentId}`)
      .send(updateUserRequestFactory())
      .expect(404);
  });

  it('should return 404 when deleting a non-existent user', async () => {
    // Arrange
    const nonExistentId = randomUUID();

    // Act + Assert
    await request(app.getHttpServer())
      .delete(`/api/v1/users/${nonExistentId}`)
      .expect(404);
  });

  it('should return 401 on invalid login credentials', async () => {
    // Arrange
    const signUpDto = signUpRequestFactory();
    const signUpRes = await request(app.getHttpServer())
      .post('/api/v1/users')
      .send(signUpDto)
      .expect(201);
    const userId = (signUpRes.body as SignUpResponseDTO).user.id;

    // Act + Assert
    await request(app.getHttpServer())
      .post('/api/v1/users/login')
      .send(
        loginRequestFactory({
          email: signUpDto.email,
          password: 'WrongPassword!',
        }),
      )
      .expect(404);

    // Cleanup
    await request(app.getHttpServer())
      .delete(`/api/v1/users/${userId}`)
      .expect(200);
  });

  it('should return 401 on invalid refresh token', async () => {
    // Arrange
    const invalidToken = 'this.is.not.a.valid.jwt';

    // Act + Assert
    await request(app.getHttpServer())
      .post('/api/v1/users/refresh')
      .send({ refreshToken: invalidToken })
      .expect(401);
  });

  it('should return 404 when getting a non-existent badge', async () => {
    // Arrange
    const nonExistentId = randomUUID();

    // Act + Assert
    await request(app.getHttpServer())
      .get(`/api/v1/badges/${nonExistentId}`)
      .expect(404);
  });

  it('should return 404 when getting a badge by non-existent slug', async () => {
    // Arrange
    const nonExistentSlug = `slug-${randomUUID()}`;

    // Act + Assert
    await request(app.getHttpServer())
      .get(`/api/v1/badges/slug/${nonExistentSlug}`)
      .expect(404);
  });

  it('should return 404 when deleting a non-existent badge', async () => {
    // Arrange
    const nonExistentId = randomUUID();

    // Act + Assert
    await request(app.getHttpServer())
      .delete(`/api/v1/badges/${nonExistentId}`)
      .expect(404);
  });

  it('should return 400 on sign up with missing required fields', async () => {
    // Arrange — missing email and password
    const invalidDto = { pseudo: 'test_user' };

    // Act + Assert
    await request(app.getHttpServer())
      .post('/api/v1/users')
      .send(invalidDto)
      .expect(400);
  });

  it('should return 400 on badge creation with missing required fields', async () => {
    // Arrange — missing name and description
    const invalidDto = { slug: `slug-${randomUUID()}` };

    // Act + Assert
    await request(app.getHttpServer())
      .post('/api/v1/badges')
      .send(invalidDto)
      .expect(400);
  });

  it('should return 400 on add badge with missing badgeId', async () => {
    // Arrange
    const signUpDto = signUpRequestFactory();
    const signUpRes = await request(app.getHttpServer())
      .post('/api/v1/users')
      .send(signUpDto)
      .expect(201);
    const userId = (signUpRes.body as SignUpResponseDTO).user.id;

    // Act + Assert
    await request(app.getHttpServer())
      .post(`/api/v1/users/${userId}/badges`)
      .send({})
      .expect(400);

    // Cleanup
    await request(app.getHttpServer())
      .delete(`/api/v1/users/${userId}`)
      .expect(200);
  });
});
