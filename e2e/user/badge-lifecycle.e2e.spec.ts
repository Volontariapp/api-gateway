import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createApp } from '../helpers/create-app.helper.js';
import type { TestClient } from '../helpers/test-client.helper.js';
import { createTestClient } from '../helpers/test-client.helper.js';
import type {
  BadgeResponseDTO,
  ListBadgesResponseDTO,
} from '../../src/modules/user/dto/response/index.js';
import { createBadgeRequestFactory } from './user-test.factory.js';
import { UserRoles } from '@volontariapp/shared';

describe('Badge Lifecycle (E2E)', () => {
  let app: INestApplication;
  let client: TestClient;

  beforeAll(async () => {
    app = await createApp();
    client = await createTestClient(app).login({ id: randomUUID(), role: UserRoles.ADMIN });
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── Badge CRUD ───────────────────────────────────────────────────────────

  describe('Badge CRUD', () => {
    it('should create a badge', async () => {
      const dto = createBadgeRequestFactory();

      const res = await client.post('/api/v1/badges').send(dto).expect(201);

      const body = res.body as BadgeResponseDTO;
      expect(body.badge.id).toBeDefined();
      expect(body.badge.name).toBe(dto.name);
      expect(body.badge.slug).toBe(dto.slug);
      expect(body.badge.description).toBe(dto.description);

      // Cleanup
      await client.delete(`/api/v1/badges/${body.badge.id}`).expect(200);
    });

    it('should get a badge by ID', async () => {
      const dto = createBadgeRequestFactory();
      const createRes = await client.post('/api/v1/badges').send(dto).expect(201);
      const badgeId = (createRes.body as BadgeResponseDTO).badge.id;

      const res = await client.get(`/api/v1/badges/${badgeId}`).expect(200);

      const body = res.body as BadgeResponseDTO;
      expect(body.badge.id).toBe(badgeId);
      expect(body.badge.slug).toBe(dto.slug);

      // Cleanup
      await client.delete(`/api/v1/badges/${badgeId}`).expect(200);
    });

    it('should get a badge by slug', async () => {
      const dto = createBadgeRequestFactory();
      const createRes = await client.post('/api/v1/badges').send(dto).expect(201);
      const badgeId = (createRes.body as BadgeResponseDTO).badge.id;

      const res = await client.get(`/api/v1/badges/slug/${dto.slug}`).expect(200);

      const body = res.body as BadgeResponseDTO;
      expect(body.badge.slug).toBe(dto.slug);
      expect(body.badge.id).toBe(badgeId);

      // Cleanup
      await client.delete(`/api/v1/badges/${badgeId}`).expect(200);
    });

    it('should list all badges', async () => {
      const dto = createBadgeRequestFactory();
      const createRes = await client.post('/api/v1/badges').send(dto).expect(201);
      const badgeId = (createRes.body as BadgeResponseDTO).badge.id;

      const res = await client.get('/api/v1/badges').expect(200);

      const body = res.body as ListBadgesResponseDTO;
      expect(Array.isArray(body.badges)).toBe(true);
      expect(body.badges.some((b) => b.id === badgeId)).toBe(true);

      // Cleanup
      await client.delete(`/api/v1/badges/${badgeId}`).expect(200);
    });

    it('should update a badge', async () => {
      const dto = createBadgeRequestFactory();
      const createRes = await client.post('/api/v1/badges').send(dto).expect(201);
      const badgeId = (createRes.body as BadgeResponseDTO).badge.id;

      const updatedName = `${dto.name}-Updated`;
      await client.patch(`/api/v1/badges/${badgeId}`).send({ name: updatedName }).expect(200);

      // Verify update
      const getRes = await client.get(`/api/v1/badges/${badgeId}`).expect(200);
      const body = getRes.body as BadgeResponseDTO;
      expect(body.badge.name).toBe(updatedName);

      // Cleanup
      await client.delete(`/api/v1/badges/${badgeId}`).expect(200);
    });

    it('should delete a badge', async () => {
      const dto = createBadgeRequestFactory();
      const createRes = await client.post('/api/v1/badges').send(dto).expect(201);
      const badgeId = (createRes.body as BadgeResponseDTO).badge.id;

      await client.delete(`/api/v1/badges/${badgeId}`).expect(200);

      // Verify deletion
      await client.get(`/api/v1/badges/${badgeId}`).expect(404);
    });
  });

  // ─── Badge Errors ─────────────────────────────────────────────────────────

  describe('Badge Errors', () => {
    it('should return 409 on duplicate badge slug', async () => {
      const dto = createBadgeRequestFactory();
      const createRes = await client.post('/api/v1/badges').send(dto).expect(201);
      const badgeId = (createRes.body as BadgeResponseDTO).badge.id;

      await client.post('/api/v1/badges').send(dto).expect(409);

      // Cleanup
      await client.delete(`/api/v1/badges/${badgeId}`).expect(200);
    });

    it('should return 404 when getting a non-existent badge', async () => {
      await client.get(`/api/v1/badges/${randomUUID()}`).expect(404);
    });

    it('should return 404 when getting a badge by non-existent slug', async () => {
      await client.get(`/api/v1/badges/slug/slug-${randomUUID()}`).expect(404);
    });

    it('should return 404 when deleting a non-existent badge', async () => {
      await client.delete(`/api/v1/badges/${randomUUID()}`).expect(404);
    });

    it('should return 400 on badge creation with missing required fields', async () => {
      await client
        .post('/api/v1/badges')
        .send({ slug: `slug-${randomUUID()}` })
        .expect(400);
    });
  });

  // ─── Full Badge Lifecycle ─────────────────────────────────────────────────

  describe('Full Badge Lifecycle', () => {
    it('create → getById → getBySlug → list → update → conflict → delete → 404', async () => {
      const dto = createBadgeRequestFactory();

      // 1. Create
      const createRes = await client.post('/api/v1/badges').send(dto).expect(201);
      const body = createRes.body as BadgeResponseDTO;
      const badgeId = body.badge.id;
      expect(body.badge.slug).toBe(dto.slug);

      // 2. Get by ID
      const getByIdRes = await client.get(`/api/v1/badges/${badgeId}`).expect(200);
      expect((getByIdRes.body as BadgeResponseDTO).badge.id).toBe(badgeId);

      // 3. Get by slug
      const getBySlugRes = await client.get(`/api/v1/badges/slug/${dto.slug}`).expect(200);
      expect((getBySlugRes.body as BadgeResponseDTO).badge.slug).toBe(dto.slug);

      // 4. List
      const listRes = await client.get('/api/v1/badges').expect(200);
      expect((listRes.body as ListBadgesResponseDTO).badges.some((b) => b.id === badgeId)).toBe(
        true,
      );

      // 5. Update
      await client
        .patch(`/api/v1/badges/${badgeId}`)
        .send({ name: `${dto.name}-Updated` })
        .expect(200);

      // 6. Conflict
      await client.post('/api/v1/badges').send(dto).expect(409);

      // 7. Delete
      await client.delete(`/api/v1/badges/${badgeId}`).expect(200);

      // 8. 404 after delete
      await client.get(`/api/v1/badges/${badgeId}`).expect(404);
    });
  });
});
