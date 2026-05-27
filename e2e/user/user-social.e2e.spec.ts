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
import type { ListUsersPublicResponseDTO } from '../../src/modules/user/dto/response/index.js';

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

  it('should fetch event participants', async () => {
    const client = await createTestClient(app).login({
      id: randomUUID(),
      role: UserRoles.VOLUNTEER,
    });
    const eventId = randomUUID();
    const res = await client.get(`/api/v1/users/event/${eventId}/participants`).expect(200);
    const body = res.body as ListUsersPublicResponseDTO;
    expect(body).toHaveProperty('users');
    expect(Array.isArray(body.users)).toBe(true);
  });

  it('should fetch post likers', async () => {
    const client = await createTestClient(app).login({
      id: randomUUID(),
      role: UserRoles.VOLUNTEER,
    });
    const postId = randomUUID();
    const res = await client.get(`/api/v1/users/post/${postId}/likers`).expect(200);
    const body = res.body as ListUsersPublicResponseDTO;
    expect(body).toHaveProperty('users');
    expect(Array.isArray(body.users)).toBe(true);
  });
});
