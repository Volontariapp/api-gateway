import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module.js';
import { GlobalExceptionFilter } from '@volontariapp/errors-nest';
import { randomUUID } from 'node:crypto';
import { loadConfig } from '@volontariapp/config';
import { CustomConfig } from '../../src/config/base-config.js';
import { EventState, EventType as GrpcEventType } from '@volontariapp/contracts-nest';
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

  it('should list and search multiple events as an admin when onlyAvailable is false', async () => {
    const client = await createTestClient(app).login({ id: randomUUID(), role: UserRoles.ADMIN });

    const event1Dto = createEventRequestFactory({ title: `SearchTest-1-${randomUUID()}` });
    const event2Dto = createEventRequestFactory({ title: `SearchTest-2-${randomUUID()}` });

    const res1 = await client.post('/api/v1/events').send(event1Dto).expect(201);
    const res2 = await client.post('/api/v1/events').send(event2Dto).expect(201);

    const event1Id = (res1.body as EventWebResponse).event.id;
    const event2Id = (res2.body as EventWebResponse).event.id;

    try {
      const listRes = await client
        .get('/api/v1/events')
        .query({ onlyAvailable: false })
        .expect(200);

      const listBody = listRes.body as ListEventsWebResponse;
      expect(listBody.events.some((e) => e.id === event1Id)).toBe(true);
      expect(listBody.events.some((e) => e.id === event2Id)).toBe(true);

      const searchRes = await client
        .get('/api/v1/events')
        .query({ searchTerm: `SearchTest-1` })
        .expect(200);

      const searchBody = searchRes.body as ListEventsWebResponse;
      expect(searchBody.events.some((e) => e.id === event1Id)).toBe(true);
      expect(searchBody.events.some((e) => e.id === event2Id)).toBe(false);
    } finally {
      await client.delete(`/api/v1/events/${event1Id}`).expect(200);
      await client.delete(`/api/v1/events/${event2Id}`).expect(200);
    }
  });
  it('should return correct numeric type values in event responses (debug type serialization)', async () => {
    const client = await createTestClient(app).login({ id: randomUUID(), role: UserRoles.ADMIN });

    // Create one SOCIAL event and one ECOLOGY event
    const socialDto = createEventRequestFactory({ type: GrpcEventType.EVENT_TYPE_SOCIAL });
    const ecoDto = createEventRequestFactory({ type: GrpcEventType.EVENT_TYPE_ECOLOGY });

    const socialRes = await client.post('/api/v1/events').send(socialDto).expect(201);
    const ecoRes = await client.post('/api/v1/events').send(ecoDto).expect(201);

    const socialBody = socialRes.body as EventWebResponse;
    const ecoBody = ecoRes.body as EventWebResponse;

    const socialId = socialBody.event.id;
    const ecoId = ecoBody.event.id;

    try {
      // --- Assert create response ---
      console.log(
        '[TYPE-DEBUG] SOCIAL create response type:',
        socialBody.event.type,
        '| typeof:',
        typeof socialBody.event.type,
      );
      console.log(
        '[TYPE-DEBUG] ECO create response type:',
        ecoBody.event.type,
        '| typeof:',
        typeof ecoBody.event.type,
      );
      console.log('[TYPE-DEBUG] GrpcEventType.EVENT_TYPE_SOCIAL:', GrpcEventType.EVENT_TYPE_SOCIAL);
      console.log(
        '[TYPE-DEBUG] GrpcEventType.EVENT_TYPE_ECOLOGY:',
        GrpcEventType.EVENT_TYPE_ECOLOGY,
      );

      expect(socialBody.event.type).toBe(GrpcEventType[GrpcEventType.EVENT_TYPE_SOCIAL]);
      expect(ecoBody.event.type).toBe(GrpcEventType[GrpcEventType.EVENT_TYPE_ECOLOGY]);

      // --- Assert GET single event ---
      const getSocialRes = await client.get(`/api/v1/events/${socialId}`).expect(200);
      const getSocialBody = getSocialRes.body as EventWebResponse;
      console.log(
        '[TYPE-DEBUG] GET single SOCIAL type:',
        getSocialBody.event.type,
        '| typeof:',
        typeof getSocialBody.event.type,
      );
      expect(getSocialBody.event.type).toBe(GrpcEventType[GrpcEventType.EVENT_TYPE_SOCIAL]);

      // --- Assert list response ---
      const listRes = await client
        .get('/api/v1/events')
        .query({ onlyAvailable: false, searchTerm: socialDto.title })
        .expect(200);
      const listBody = listRes.body as ListEventsWebResponse;
      const foundSocial = listBody.events.find((e) => e.id === socialId);
      console.log(
        '[TYPE-DEBUG] LIST SOCIAL type:',
        foundSocial?.type,
        '| typeof:',
        typeof foundSocial?.type,
      );
      expect(foundSocial?.type).toBe(GrpcEventType[GrpcEventType.EVENT_TYPE_SOCIAL]);
    } finally {
      await client.delete(`/api/v1/events/${socialId}`).expect(200);
      await client.delete(`/api/v1/events/${ecoId}`).expect(200);
    }
  });

  it('should accept string representations of enums for state updates from the frontend', async () => {
    const client = await createTestClient(app).login({ id: randomUUID(), role: UserRoles.ADMIN });

    const eventDto = createEventRequestFactory({ type: GrpcEventType.EVENT_TYPE_SOCIAL });
    const createRes = await client.post('/api/v1/events').send(eventDto).expect(201);
    const eventId = (createRes.body as EventWebResponse).event.id;

    try {
      await client
        .patch(`/api/v1/events/${eventId}/state`)
        .send({ newState: 'EVENT_STATE_PUBLISHED' })
        .expect(200);

      const getRes = await client.get(`/api/v1/events/${eventId}`).expect(200);
      const getBody = getRes.body as EventWebResponse;
      expect(getBody.event.state).toBe(EventState[EventState.EVENT_STATE_PUBLISHED]);
    } finally {
      await client.delete(`/api/v1/events/${eventId}`).expect(200);
    }
  });

  it('should list all events from multiple users without filtering by creator on the generic GET endpoint', async () => {
    const clientA = await createTestClient(app).login({ id: randomUUID(), role: UserRoles.ADMIN });
    const clientB = await createTestClient(app).login({ id: randomUUID(), role: UserRoles.ADMIN });

    const eventIdsA: string[] = [];
    const eventIdsB: string[] = [];

    // User A creates 20 events
    for (let i = 0; i < 20; i++) {
      const eventDto = createEventRequestFactory({ title: `UserA-Event-${randomUUID()}` });
      const createRes = await clientA.post('/api/v1/events').send(eventDto).expect(201);
      eventIdsA.push((createRes.body as EventWebResponse).event.id);
    }

    // User B creates 20 events
    for (let i = 0; i < 20; i++) {
      const eventDto = createEventRequestFactory({ title: `UserB-Event-${randomUUID()}` });
      const createRes = await clientB.post('/api/v1/events').send(eventDto).expect(201);
      eventIdsB.push((createRes.body as EventWebResponse).event.id);
    }

    try {
      // User A retrieves events
      const listRes = await clientA
        .get('/api/v1/events')
        .query({ onlyAvailable: false })
        .expect(200);

      const listBody = listRes.body as ListEventsWebResponse;

      // We expect at least 40 events to be present and totalCount >= 40
      expect(listBody.events.length).toBeGreaterThanOrEqual(40);
      expect(listBody.totalCount).toBeGreaterThanOrEqual(40);

      // Verify User A can see User B's events
      const foundUserBEvents = listBody.events.filter((e) => eventIdsB.includes(e.id));
      expect(foundUserBEvents.length).toBe(20);

      // Verify User A can see their own events
      const foundUserAEvents = listBody.events.filter((e) => eventIdsA.includes(e.id));
      expect(foundUserAEvents.length).toBe(20);
    } finally {
      // Cleanup
      for (const id of eventIdsA) {
        await clientA.delete(`/api/v1/events/${id}`).expect(200);
      }
      for (const id of eventIdsB) {
        await clientB.delete(`/api/v1/events/${id}`).expect(200);
      }
    }
  });
});
