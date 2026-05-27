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
import { createTestClient } from '../helpers/test-client.helper.js';
import type { SearchEventsResponseDTO } from '../../src/modules/event/dto/response/index.js';

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
});
