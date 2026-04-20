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

describe('Social User Node (E2E)', () => {
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

  it('should create, check existence, and delete a social user node', async () => {
    const userId = randomUUID();

    const createResponse = await request(app.getHttpServer())
      .post(`/api/v1/social/users/${userId}`)
      .expect(201);

    expect(createResponse.body).toHaveProperty('success', true);

    const getResponse = await request(app.getHttpServer())
      .get(`/api/v1/social/users/${userId}`)
      .expect(200);

    expect(getResponse.body).toHaveProperty('exists', true);

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/api/v1/social/users/${userId}`)
      .expect(200);

    expect(deleteResponse.body).toHaveProperty('success', true);

    const finalGetResponse = await request(app.getHttpServer())
      .get(`/api/v1/social/users/${userId}`)
      .expect(200);

    expect(finalGetResponse.body).toHaveProperty('exists', false);
  });
});
