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
import type {
  GetUserNodeWebResponse,
  GetMyFollowsWebResponse,
  GetEventRelatedToPostWebResponse,
} from '@volontariapp/contracts';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

describe('Social Relations & Interactions (E2E)', () => {
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

  it('should handle complex user relations: follow, post ownership, and likes', async () => {
    const followerId = randomUUID();
    const followedId = randomUUID();
    const postId = randomUUID();

    await request(app.getHttpServer())
      .post(`/api/v1/social/users/${followerId}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/social/users/${followedId}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/social/users/${followerId}/follow/${followedId}`)
      .expect(201);

    const followsResponse = await request(app.getHttpServer())
      .get(`/api/v1/social/users/${followerId}/follows`)
      .expect(200);

    const followsData = followsResponse.body as GetMyFollowsWebResponse;
    expect(followsData.ids).toContain(followedId);

    const followersResponse = await request(app.getHttpServer())
      .get(`/api/v1/social/users/${followedId}/followers`)
      .expect(200);

    const followersData = followersResponse.body as GetMyFollowsWebResponse;
    expect(followersData.ids).toContain(followerId);

    await request(app.getHttpServer())
      .post(`/api/v1/social/posts/${postId}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/social/users/${followedId}/posts/${postId}/own`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/social/users/${followerId}/likes/${postId}`)
      .expect(201);

    const userLikesResponse = await request(app.getHttpServer())
      .get(`/api/v1/social/users/${followerId}/likes`)
      .expect(200);

    const userLikesData = userLikesResponse.body as GetMyFollowsWebResponse;
    expect(userLikesData.ids).toContain(postId);

    const postLikersResponse = await request(app.getHttpServer())
      .get(`/api/v1/social/posts/${postId}/likers`)
      .expect(200);

    const postLikersData = postLikersResponse.body as GetMyFollowsWebResponse;
    expect(postLikersData.ids).toContain(followerId);

    await request(app.getHttpServer())
      .delete(`/api/v1/social/users/${followerId}/likes/${postId}`)
      .expect(200);

    const finalPostLikersResponse = await request(app.getHttpServer())
      .get(`/api/v1/social/posts/${postId}/likers`)
      .expect(200);

    const finalPostLikersData =
      finalPostLikersResponse.body as GetMyFollowsWebResponse;
    expect(finalPostLikersData.ids).not.toContain(followerId);

    await request(app.getHttpServer())
      .delete(`/api/v1/social/users/${followerId}/follow/${followedId}`)
      .expect(200);

    const finalFollowsResponse = await request(app.getHttpServer())
      .get(`/api/v1/social/users/${followerId}/follows`)
      .expect(200);

    const finalFollowsData =
      finalFollowsResponse.body as GetMyFollowsWebResponse;
    expect(finalFollowsData.ids).not.toContain(followedId);

    await request(app.getHttpServer())
      .delete(`/api/v1/social/users/${followedId}/posts/${postId}/own`)
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/social/posts/${postId}`)
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/social/users/${followerId}`)
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/social/users/${followedId}`)
      .expect(200);
  });

  it('should handle error cases and non-existent nodes', async () => {
    const userId = randomUUID();
    const fakeId = randomUUID();

    const initialCheck = await request(app.getHttpServer())
      .get(`/api/v1/social/users/${userId}`)
      .expect(200);
    const initialCheckData = initialCheck.body as GetUserNodeWebResponse;
    expect(initialCheckData.exists).toBe(false);

    await request(app.getHttpServer())
      .post(`/api/v1/social/users/${userId}`)
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/api/v1/social/users/${userId}`)
      .expect(200);

    const finalCheck = await request(app.getHttpServer())
      .get(`/api/v1/social/users/${userId}`)
      .expect(200);
    const finalCheckData = finalCheck.body as GetUserNodeWebResponse;
    expect(finalCheckData.exists).toBe(false);

    await request(app.getHttpServer())
      .post(`/api/v1/social/users/${userId}/follow/${fakeId}`)
      .expect(201);

    const followsResponse = await request(app.getHttpServer())
      .get(`/api/v1/social/users/${userId}/follows`)
      .expect(200);
    const followsData = followsResponse.body as GetMyFollowsWebResponse;
    expect(followsData.ids).not.toContain(fakeId);
  });

  it('should handle complete flows: interaction between users, events, and posts', async () => {
    const userAId = randomUUID();
    const userBId = randomUUID();
    const eventId = randomUUID();
    const postId = randomUUID();

    await request(app.getHttpServer())
      .post(`/api/v1/social/users/${userAId}`)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/social/users/${userBId}`)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/social/events/${eventId}`)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/social/posts/${postId}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/social/users/${userBId}/events/${eventId}/participate`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/social/users/${userBId}/posts/${postId}/own`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/social/events/${eventId}/posts/${postId}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/social/users/${userAId}/follow/${userBId}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/social/users/${userAId}/likes/${postId}`)
      .expect(201);

    const eventPostsResponse = await request(app.getHttpServer())
      .get(`/api/v1/social/events/${eventId}/related-posts`)
      .expect(200);
    const eventPostsData = eventPostsResponse.body as GetMyFollowsWebResponse;
    expect(eventPostsData.ids).toContain(postId);

    const eventParticipantsResponse = await request(app.getHttpServer())
      .get(`/api/v1/social/events/${eventId}/participants`)
      .expect(200);
    const eventParticipantsData =
      eventParticipantsResponse.body as GetMyFollowsWebResponse;
    expect(eventParticipantsData.ids).toContain(userBId);

    const userALikesResponse = await request(app.getHttpServer())
      .get(`/api/v1/social/users/${userAId}/likes`)
      .expect(200);
    const userALikesData = userALikesResponse.body as GetMyFollowsWebResponse;
    expect(userALikesData.ids).toContain(postId);

    await request(app.getHttpServer())
      .delete(`/api/v1/social/users/${userAId}/likes/${postId}`)
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/social/users/${userAId}/follow/${userBId}`)
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/social/events/${eventId}/posts/${postId}`)
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/social/users/${userBId}/posts/${postId}/own`)
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/social/users/${userBId}/events/${eventId}/participate`)
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/social/posts/${postId}`)
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/social/events/${eventId}`)
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/social/users/${userAId}`)
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/social/users/${userBId}`)
      .expect(200);
  });

  it('should cover additional social routes: blocks, feeds, and ownerships', async () => {
    const userAId = randomUUID();
    const userBId = randomUUID();
    const eventId = randomUUID();
    const postId = randomUUID();

    await request(app.getHttpServer())
      .post(`/api/v1/social/users/${userAId}`)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/social/users/${userBId}`)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/social/events/${eventId}`)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/social/posts/${postId}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/social/users/${userAId}/block/${userBId}`)
      .expect(201);

    const blocksRes = await request(app.getHttpServer())
      .get(`/api/v1/social/users/${userAId}/blocks`)
      .expect(200);
    const blocksData = blocksRes.body as GetMyFollowsWebResponse;
    expect(blocksData.ids).toContain(userBId);

    const whoBlockedMeRes = await request(app.getHttpServer())
      .get(`/api/v1/social/users/${userBId}/who-blocked-me`)
      .expect(200);
    const whoBlockedMeData = whoBlockedMeRes.body as GetMyFollowsWebResponse;
    expect(whoBlockedMeData.ids).toContain(userAId);

    await request(app.getHttpServer())
      .delete(`/api/v1/social/users/${userAId}/block/${userBId}`)
      .expect(200);

    const finalBlocksRes = await request(app.getHttpServer())
      .get(`/api/v1/social/users/${userAId}/blocks`)
      .expect(200);
    const finalBlocksData = finalBlocksRes.body as GetMyFollowsWebResponse;
    expect(finalBlocksData.ids).not.toContain(userBId);

    await request(app.getHttpServer())
      .post(`/api/v1/social/users/${userAId}/posts/${postId}/own`)
      .expect(201);

    const userPostsRes = await request(app.getHttpServer())
      .get(`/api/v1/social/users/${userAId}/posts`)
      .expect(200);
    const userPostsData = userPostsRes.body as GetMyFollowsWebResponse;
    expect(userPostsData.ids).toContain(postId);

    const feedRes = await request(app.getHttpServer())
      .get(`/api/v1/social/users/${userAId}/feed`)
      .expect(200);
    const feedData = feedRes.body as GetMyFollowsWebResponse;
    expect(feedData.ids).toBeDefined();

    await request(app.getHttpServer())
      .post(`/api/v1/social/users/${userAId}/events/${eventId}/own`)
      .expect(201);

    const createdEventsRes = await request(app.getHttpServer())
      .get(`/api/v1/social/users/${userAId}/events/created`)
      .expect(200);
    const createdEventsData = createdEventsRes.body as GetMyFollowsWebResponse;
    expect(createdEventsData.ids).toContain(eventId);

    await request(app.getHttpServer())
      .post(`/api/v1/social/users/${userAId}/events/${eventId}/participate`)
      .expect(201);

    const participatedEventsRes = await request(app.getHttpServer())
      .get(`/api/v1/social/users/${userAId}/events/participated`)
      .expect(200);
    const participatedEventsData =
      participatedEventsRes.body as GetMyFollowsWebResponse;
    expect(participatedEventsData.ids).toContain(eventId);

    await request(app.getHttpServer())
      .post(`/api/v1/social/events/${eventId}/posts/${postId}`)
      .expect(201);

    const relatedEventRes = await request(app.getHttpServer())
      .get(`/api/v1/social/posts/${postId}/related-event`)
      .expect(200);
    const relatedEventData =
      relatedEventRes.body as GetEventRelatedToPostWebResponse;
    expect(relatedEventData.eventId).toBe(eventId);

    await request(app.getHttpServer())
      .delete(`/api/v1/social/events/${eventId}/posts/${postId}`)
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/social/users/${userAId}/events/${eventId}/participate`)
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/social/users/${userAId}/events/${eventId}/own`)
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/social/users/${userAId}/posts/${postId}/own`)
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/social/posts/${postId}`)
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/social/events/${eventId}`)
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/social/users/${userAId}`)
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/social/users/${userBId}`)
      .expect(200);
  });

  it('should map domain errors from all social services (Conflict & NotFound)', async () => {
    const userAId = randomUUID();
    const userBId = randomUUID();
    const postId = randomUUID();
    const eventId = randomUUID();

    await request(app.getHttpServer())
      .post(`/api/v1/social/users/${userAId}`)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/social/users/${userBId}`)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/social/posts/${postId}`)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/social/events/${eventId}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/social/users/${userAId}`)
      .expect(409);

    await request(app.getHttpServer())
      .post(`/api/v1/social/posts/${postId}`)
      .expect(409);

    await request(app.getHttpServer())
      .post(`/api/v1/social/events/${eventId}`)
      .expect(409);

    const randomUser = randomUUID();
    await request(app.getHttpServer())
      .delete(`/api/v1/social/users/${randomUser}`)
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/api/v1/social/users/${userAId}/follow/${userBId}`)
      .expect(404);

    await request(app.getHttpServer())
      .post(`/api/v1/social/users/${userAId}/events/${eventId}/participate`)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/social/users/${userAId}/events/${eventId}/participate`)
      .expect(409);

    await request(app.getHttpServer())
      .delete(`/api/v1/social/users/${userBId}/events/${eventId}/participate`)
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/api/v1/social/users/${userAId}/events/${eventId}/participate`)
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/social/posts/${postId}`)
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/social/events/${eventId}`)
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/social/users/${userAId}`)
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/social/users/${userBId}`)
      .expect(200);
  });
});
