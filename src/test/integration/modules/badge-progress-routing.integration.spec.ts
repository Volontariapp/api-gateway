import { afterAll, afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals';
import type { ExecutionContext, INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { of } from 'rxjs';
import { AccessTokenGuard } from '@volontariapp/auth';
import {
  BADGE_SERVICE_NAME,
  USER_SERVICE_NAME,
  type BadgeServiceClient,
  type UserServiceClient,
} from '@volontariapp/contracts-nest';
import { createMock } from '@volontariapp/testing';
import type { WithMetadata } from '../../../common/types/grpc.types.js';
import { USER_PACKAGE } from '../../../grpc/grpc-packages.js';
import { UserQueryController } from '../../../modules/user/controllers/queries/user/user.query-controller.js';
import { BadgeQueryController } from '../../../modules/user/controllers/queries/badge/badge.query-controller.js';
import { BadgeProgressQueryController } from '../../../modules/user/controllers/queries/badge/badge-progress.query-controller.js';
import { PublicFileUrlService } from '../../../modules/storage/public-file-url.service.js';
import { MockServicesClientGrpc } from '../../helpers/mocks/services-client-grpc.mock.js';
import { PublicFileUrlFactory } from '../../helpers/factories/public-file-url.factory.js';
import { BadgeProgressFactory } from '../../helpers/factories/badge-progress.factory.js';
import { UserFactory } from '../../helpers/factories/user.factory.js';
import { createAuthUserMock } from '../../helpers/factories/auth-user.factory.js';

/**
 * Routing of `GET /users/me/badges/progress`: it must reach the badge progress controller and not be
 * captured by the neighbouring `users/...` and `badges/:id` routes. Controllers are registered in the
 * same order as in UserModule.
 */
describe('Badge progress route (Integration)', () => {
  let app: INestApplication;
  let server: Server;
  const userService = createMock<WithMetadata<UserServiceClient>>();
  const badgeService = createMock<WithMetadata<BadgeServiceClient>>();
  const authUser = createAuthUserMock();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UserQueryController, BadgeQueryController, BadgeProgressQueryController],
      providers: [
        {
          provide: USER_PACKAGE,
          useValue: new MockServicesClientGrpc({
            [USER_SERVICE_NAME]: userService,
            [BADGE_SERVICE_NAME]: badgeService,
          }),
        },
        { provide: PublicFileUrlService, useValue: PublicFileUrlFactory.createService() },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          context.switchToHttp().getRequest<{ user: unknown }>().user = authUser;
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
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

  it('should route GET /users/me/badges/progress to the progress controller and answer 200', async () => {
    const progressSpy = jest.spyOn(badgeService, 'getMyBadgeProgress').mockReturnValue(
      of({
        badges: [
          BadgeProgressFactory.createLocked(),
          BadgeProgressFactory.createUnlocked(new Date('2026-11-01T08:30:00.000Z'), {
            slug: 'EVENT_PARTICIPATION_TIER_1',
            points: 100,
          }),
        ],
      }),
    );
    const getUserSpy = jest.spyOn(userService, 'getUser');
    const getBadgeSpy = jest.spyOn(badgeService, 'getBadge');

    const response = await request(server).get('/users/me/badges/progress').expect(200);

    expect(progressSpy).toHaveBeenCalledTimes(1);
    expect(progressSpy.mock.calls[0]?.[0]).toEqual({});
    expect(getUserSpy).not.toHaveBeenCalled();
    expect(getBadgeSpy).not.toHaveBeenCalled();

    const body = response.body as { badges: Array<Record<string, unknown>> };
    expect(body.badges).toHaveLength(2);
    expect(body.badges[0]).toMatchObject({
      slug: 'EVENT_PARTICIPATION_TIER_2',
      points: 250,
      unlocked: false,
      percent: 60,
    });
    expect(body.badges[0]?.awardedAt).toBeUndefined();
    expect(body.badges[1]).toMatchObject({ unlocked: true, percent: 100 });
    expect(body.badges[1]?.awardedAt).toBe('2026-11-01T08:30:00.000Z');
  });

  it('should ignore any user id sent by the client: the identity comes from the token only', async () => {
    const progressSpy = jest
      .spyOn(badgeService, 'getMyBadgeProgress')
      .mockReturnValue(of({ badges: [] }));

    await request(server)
      .get('/users/me/badges/progress?userId=someone-else')
      .set('x-user-id', 'someone-else')
      .expect(200);

    expect(progressSpy.mock.calls[0]?.[0]).toEqual({});
  });

  it('should keep serving GET /users/me from the user controller', async () => {
    const getUserSpy = jest
      .spyOn(userService, 'getUser')
      .mockReturnValue(of({ user: UserFactory.createUser({ id: authUser.id }) }));
    const progressSpy = jest.spyOn(badgeService, 'getMyBadgeProgress');

    await request(server).get('/users/me').expect(200);

    expect(getUserSpy).toHaveBeenCalledTimes(1);
    expect(progressSpy).not.toHaveBeenCalled();
  });

  it('should keep serving GET /badges/:id from the badge controller', async () => {
    const getBadgeSpy = jest
      .spyOn(badgeService, 'getBadge')
      .mockReturnValue(of({ badge: BadgeProgressFactory.createBadge() }));
    const progressSpy = jest.spyOn(badgeService, 'getMyBadgeProgress');

    const response = await request(server).get('/badges/some-badge-id').expect(200);

    expect(getBadgeSpy).toHaveBeenCalledTimes(1);
    expect(progressSpy).not.toHaveBeenCalled();
    expect((response.body as { badge: { points: number } }).badge.points).toBe(500);
  });
});
