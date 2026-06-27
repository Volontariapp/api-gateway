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
import type { SearchEventsResponseDTO } from '../../src/modules/event/dto/response/index.js';
import { createEventRequestFactory } from './event-test.factory.js';
import type { EventWebResponse } from '@volontariapp/contracts';

describe('Event Me Endpoints (E2E)', () => {
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

  it('should fetch user created events', async () => {
    const client = await createTestClient(app).login({
      id: randomUUID(),
      role: UserRoles.VOLUNTEER,
    });
    const res = await client.get('/api/v1/events/created/me').expect(200);
    const body = res.body as SearchEventsResponseDTO;
    expect(body).toHaveProperty('events');
    expect(Array.isArray(body.events)).toBe(true);
  });

  it('should fetch user participated events', async () => {
    const client = await createTestClient(app).login({
      id: randomUUID(),
      role: UserRoles.VOLUNTEER,
    });
    const res = await client.get('/api/v1/events/participated/me').expect(200);
    const body = res.body as SearchEventsResponseDTO;
    expect(body).toHaveProperty('events');
    expect(Array.isArray(body.events)).toBe(true);
  });

  it('should fetch user wished events', async () => {
    const client = await createTestClient(app).login({
      id: randomUUID(),
      role: UserRoles.VOLUNTEER,
    });
    const res = await client.get('/api/v1/events/wished/me').expect(200);
    const body = res.body as SearchEventsResponseDTO;
    expect(body).toHaveProperty('events');
    expect(Array.isArray(body.events)).toBe(true);
  });

  describe('Edge cases and error handling', () => {
    let client: TestClient;

    beforeAll(async () => {
      client = await createTestClient(app).login({ id: randomUUID(), role: UserRoles.VOLUNTEER });
    });

    it('should return empty list when user has created no events', async () => {
      const res = await client.get('/api/v1/events/created/me').expect(200);
      const body = res.body as SearchEventsResponseDTO;
      expect(body.events).toHaveLength(0);
    });

    it('should return empty list when user participates in no events', async () => {
      const res = await client.get('/api/v1/events/participated/me').expect(200);
      const body = res.body as SearchEventsResponseDTO;
      expect(body.events).toHaveLength(0);
    });

    it('should return empty list when user wishes no events', async () => {
      const res = await client.get('/api/v1/events/wished/me').expect(200);
      const body = res.body as SearchEventsResponseDTO;
      expect(body.events).toHaveLength(0);
    });

    it('should reject requests without authentication for created/me', async () => {
      const unauthClient = createTestClient(app);
      await unauthClient.get('/api/v1/events/created/me').expect(401);
    });

    it('should reject requests without authentication for participated/me', async () => {
      const unauthClient = createTestClient(app);
      await unauthClient.get('/api/v1/events/participated/me').expect(401);
    });

    it('should reject requests without authentication for wished/me', async () => {
      const unauthClient = createTestClient(app);
      await unauthClient.get('/api/v1/events/wished/me').expect(401);
    });

    it('should support pagination on created events', async () => {
      const res = await client
        .get('/api/v1/events/created/me')
        .query({ skip: 0, limit: 10 })
        .expect(200);

      const body = res.body as SearchEventsResponseDTO;
      expect(body.pagination.page).toBe(1);
      expect(body.pagination.total).toBe(0);
    });

    it('should correctly paginate created events for a user with multiple pages', async () => {
      const userId = randomUUID();
      const paginatedClient = await createTestClient(app).login({
        id: userId,
        role: UserRoles.ADMIN,
      });

      // Synchronously simulate the async outbox processing for ms-social (create user node)
      await paginatedClient.post(`/api/v1/social/users/${userId}`).send({}).expect(201);

      const eventIds: string[] = [];
      // Create 25 events
      for (let i = 0; i < 25; i++) {
        const eventDto = createEventRequestFactory({
          title: `Paginated-Event-${String(i)}-${randomUUID()}`,
        });
        const createRes = await paginatedClient.post('/api/v1/events').send(eventDto).expect(201);
        const eventId = (createRes.body as EventWebResponse).event.id;
        eventIds.push(eventId);

        // Synchronously simulate the async outbox processing for ms-social
        await paginatedClient.post(`/api/v1/social/events/${eventId}`).send({}).expect(201);
        await paginatedClient
          .post(`/api/v1/social/users/${userId}/events/${eventId}/own`)
          .send({})
          .expect(201);
      }

      try {
        // Fetch Page 1 (limit 10)
        const resPage1 = await paginatedClient
          .get('/api/v1/events/created/me')
          .query({ page: 1, limit: 10 })
          .expect(200);

        const body1 = resPage1.body as SearchEventsResponseDTO;
        expect(body1.events.length).toBe(10);
        expect(body1.pagination.total).toBeGreaterThanOrEqual(10);

        // Fetch Page 2 (limit 10)
        const resPage2 = await paginatedClient
          .get('/api/v1/events/created/me')
          .query({ page: 2, limit: 10 })
          .expect(200);

        const body2 = resPage2.body as SearchEventsResponseDTO;
        expect(body2.events.length).toBe(10);
        expect(body2.pagination.page).toBe(2);

        // Fetch Page 3 (limit 10)
        const resPage3 = await paginatedClient
          .get('/api/v1/events/created/me')
          .query({ page: 3, limit: 10 })
          .expect(200);

        const body3 = resPage3.body as SearchEventsResponseDTO;
        expect(body3.events.length).toBe(5);
        expect(body3.pagination.page).toBe(3);
      } finally {
        for (const id of eventIds) {
          await paginatedClient.delete(`/api/v1/events/${id}`).expect(200);
        }
      }
    });
  });
});
