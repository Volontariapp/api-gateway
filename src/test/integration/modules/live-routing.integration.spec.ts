import { afterAll, afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals';
import type { ExecutionContext, INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { Metadata } from '@grpc/grpc-js';
import { AccessTokenGuard } from '@volontariapp/auth';
import { EVENT_NOT_FOUND, GlobalExceptionFilter } from '@volontariapp/errors-nest';
import { createMock } from '@volontariapp/testing';
import { LiveSharingController } from '../../../modules/live/controllers/live-sharing.controller.js';
import type { LiveRevokeReason } from '../../../modules/live/constants/live.constants.js';
import { LiveSharingService } from '../../../modules/live/services/live-sharing.service.js';
import { createAuthUserMock } from '../../helpers/factories/auth-user.factory.js';
import { LIVE_CALLER_ID, LIVE_EVENT_ID } from '../../helpers/factories/live-sharing.factory.js';

describe('Live sharing routes (Integration)', () => {
  let app: INestApplication;
  let server: Server;
  const sharing = createMock<LiveSharingService>();
  const user = createAuthUserMock({ id: LIVE_CALLER_ID });
  const metadata = new Metadata();
  const path = `/live/events/${LIVE_EVENT_ID}/sharing`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [LiveSharingController],
      providers: [{ provide: LiveSharingService, useValue: sharing }],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context
            .switchToHttp()
            .getRequest<{ user: unknown; internalMetadata: Metadata }>();
          req.user = user;
          req.internalMetadata = metadata;
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    server = app.getHttpServer() as Server;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should answer PUT with 204 and authorize the authenticated caller, with the internal metadata', async () => {
    const grantSpy = jest.spyOn(sharing, 'grant').mockResolvedValue(undefined);

    await request(server).put(path).expect(204);

    expect(grantSpy).toHaveBeenCalledWith(user, LIVE_EVENT_ID, metadata);
  });

  it('should ignore any user, organizer or coordinate sent by the client', async () => {
    const grantSpy = jest.spyOn(sharing, 'grant').mockResolvedValue(undefined);

    await request(server)
      .put(`${path}?userId=other&organizerId=other`)
      .send({ userId: 'other', organizerId: 'other', eventLatitude: 1, eventLongitude: 1 })
      .expect(204);

    expect(grantSpy).toHaveBeenCalledWith(user, LIVE_EVENT_ID, metadata);
  });

  it('should answer a refusal with the 404 of an unknown event', async () => {
    jest.spyOn(sharing, 'grant').mockRejectedValue(EVENT_NOT_FOUND(LIVE_EVENT_ID));

    const response = await request(server).put(path).expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      message: EVENT_NOT_FOUND(LIVE_EVENT_ID).message,
    });
  });

  it('should refuse an event id that is not a UUID before any call', async () => {
    const grantSpy = jest.spyOn(sharing, 'grant');

    await request(server).put('/live/events/not-a-uuid/sharing').expect(400);

    expect(grantSpy).not.toHaveBeenCalled();
  });

  it('should answer DELETE with 204 and the default reason STOPPED', async () => {
    const revokeSpy = jest.spyOn(sharing, 'revoke').mockResolvedValue(undefined);

    await request(server).delete(path).expect(204);

    expect(revokeSpy).toHaveBeenCalledWith(user, LIVE_EVENT_ID, 'STOPPED');
  });

  it.each<LiveRevokeReason>(['ARRIVED', 'STOPPED', 'LEFT'])(
    'should pass the reason %s on DELETE',
    async (reason) => {
      const revokeSpy = jest.spyOn(sharing, 'revoke').mockResolvedValue(undefined);

      await request(server).delete(`${path}?reason=${reason}`).expect(204);

      expect(revokeSpy).toHaveBeenCalledWith(user, LIVE_EVENT_ID, reason);
    },
  );

  it.each(['REVOKED', 'EXPIRED', 'EVENT_ENDED', 'nope', ''])(
    'should refuse the reason "%s" on DELETE with a 400',
    async (reason) => {
      const revokeSpy = jest.spyOn(sharing, 'revoke');

      await request(server).delete(`${path}?reason=${reason}`).expect(400);

      expect(revokeSpy).not.toHaveBeenCalled();
    },
  );
});
