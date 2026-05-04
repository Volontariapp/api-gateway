import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module.js';
import { GlobalExceptionFilter } from '@volontariapp/errors-nest';
import { randomUUID } from 'node:crypto';
import { loadConfig } from '@volontariapp/config';
import { CustomConfig } from '../../src/config/base-config.js';
import { EventState } from '@volontariapp/contracts-nest';
import { TagsNames, UserRoles } from '@volontariapp/shared';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  EventWebResponse,
  ListEventsWebResponse,
  TagWebResponse,
  ListTagsWebResponse,
  ListRequirementsWebResponse,
  ActionSuccessWebResponse,
} from '@volontariapp/contracts';
import {
  createEventRequestFactory,
  createTagRequestFactory,
  addRequirementRequestFactory,
} from './event-test.factory.js';
import { setupAuth } from '../helpers/auth-helper.js';
import { createTestClient } from '../helpers/test-client.helper.js';

describe('Event Lifecycle (E2E)', () => {
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

  it('should cover tag lifecycle: create, get, update, conflict, and delete', async () => {
    const client = await createTestClient(app).login({ id: randomUUID(), role: UserRoles.ADMIN });
    const createDto = createTagRequestFactory();

    const createRes = await client.post('/api/v1/tags').send(createDto).expect(201);
    const createBody = createRes.body as TagWebResponse;
    const tagId = createBody.tag.id;
    expect(tagId).toBeDefined();

    await client.post('/api/v1/tags').send(createDto).expect(409);

    const getAllRes = await client.get('/api/v1/tags').expect(200);
    const getAllBody = getAllRes.body as ListTagsWebResponse;
    expect(getAllBody.tags).toBeDefined();

    await client
      .patch(`/api/v1/tags/${tagId}`)
      .send({
        name: `${createDto.name}-Updated`,
        balise: createDto.balise,
      })
      .expect(200);

    await client
      .patch(`/api/v1/tags/${randomUUID()}`)
      .send({ name: 'Fail', balise: TagsNames.ECOLOGIE })
      .expect(404);

    await client.delete(`/api/v1/tags/${tagId}`).expect(200);

    await client.delete(`/api/v1/tags/${tagId}`).expect(404);
  });

  it('should cover event lifecycle: create, search, update, state, requirements, and delete', async () => {
    const client = await createTestClient(app).login({ id: randomUUID(), role: UserRoles.ADMIN });
    const tagRes = await client
      .post('/api/v1/tags')
      .send(createTagRequestFactory({ balise: TagsNames.BENEVOLAT }))
      .expect(201);
    const tagBody = tagRes.body as TagWebResponse;
    const tagId = tagBody.tag.id;

    const eventDto = createEventRequestFactory({ tagIds: [tagId] });
    const createRes = await client.post('/api/v1/events').send(eventDto).expect(201);
    const createEventBody = createRes.body as EventWebResponse;
    const realEventId = createEventBody.event.id;

    const getRes = await client.get(`/api/v1/events/${realEventId}`).expect(200);
    const getBody = getRes.body as EventWebResponse;
    expect(getBody.event.title).toBe(eventDto.title);

    const searchRes = await client
      .get('/api/v1/events')
      .query({ searchTerm: eventDto.title })
      .expect(200);
    const searchBody = searchRes.body as ListEventsWebResponse;
    expect(searchBody.events.length).toBeGreaterThan(0);

    await client
      .patch(`/api/v1/events/${realEventId}`)
      .send({ description: 'Updated Description' })
      .expect(200);

    await client
      .patch(`/api/v1/events/${realEventId}/state`)
      .send({ newState: EventState.EVENT_STATE_PUBLISHED })
      .expect(200);

    const addReqDto = addRequirementRequestFactory();
    const reqRes = await client.post(`/api/v1/events/${realEventId}/requirements`).send(addReqDto);

    expect(reqRes.status).toBe(201);
    const reqBody = reqRes.body as ActionSuccessWebResponse;
    expect(reqBody.success).toBe(true);

    const listReqsRes = await client.get(`/api/v1/events/${realEventId}/requirements`).expect(200);
    const listReqsBody = listReqsRes.body as ListRequirementsWebResponse;
    expect(listReqsBody.requirements.length).toBeGreaterThan(0);
    const requirementId = listReqsBody.requirements[0].id;

    await client.delete(`/api/v1/events/${realEventId}/requirements/${requirementId}`).expect(200);

    await client.delete(`/api/v1/events/${realEventId}`).expect(200);

    await client.get(`/api/v1/events/${realEventId}`).expect(404);

    await client.delete(`/api/v1/tags/${tagId}`).expect(200);
  });

  it('should handle event date validation errors', async () => {
    const client = await createTestClient(app).login({ id: randomUUID(), role: UserRoles.ADMIN });
    const invalidEvent = createEventRequestFactory({
      startAt: new Date(Date.now() + 172800000),
      endAt: new Date(Date.now() + 86400000),
    });
    await client.post('/api/v1/events').send(invalidEvent).expect(400);
  });
});
