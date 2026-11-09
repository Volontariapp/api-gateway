import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Metadata } from '@grpc/grpc-js';
import { firstValueFrom, of, throwError } from 'rxjs';
import {
  PARTICIPATION_COMMAND_SERVICE_NAME,
  PARTICIPATION_QUERY_SERVICE_NAME,
  RELATIONSHIP_COMMAND_SERVICE_NAME,
  RELATIONSHIP_QUERY_SERVICE_NAME,
  type ParticipationCommandServiceClient,
  type ParticipationQueryServiceClient,
  type RelationshipCommandServiceClient,
  type RelationshipQueryServiceClient,
} from '@volontariapp/contracts-nest';
import { createMock } from '@volontariapp/testing';
import { SearchExclusionsCache } from '../../../../modules/event/services/search-exclusions-cache.service.js';
import { ParticipationCommandController } from '../../../../modules/social/controllers/commands/participation/participation.command-controller.js';
import { ParticipationAdminCommandController } from '../../../../modules/social/controllers/commands/participation/participation-admin.command-controller.js';
import { RelationshipCommandController } from '../../../../modules/social/controllers/commands/relationship/relationship.command-controller.js';
import { RelationshipAdminCommandController } from '../../../../modules/social/controllers/commands/relationship/relationship-admin.command-controller.js';
import { MockServicesClientGrpc } from '../../../helpers/mocks/services-client-grpc.mock.js';
import { createAuthUserMock } from '../../../helpers/factories/auth-user.factory.js';
import { SearchExclusionsFactory } from '../../../helpers/factories/search-exclusions.factory.js';
import { PARTICIPATION_EVENT_ID as eventId } from '../../../helpers/factories/participation.factory.js';

describe('Search exclusions invalidation by the social command routes (Unit)', () => {
  const metadata = new Metadata();
  const req = { internalMetadata: metadata };
  const me = createAuthUserMock({ id: 'user-me' });
  const otherId = 'user-other';
  let cache: SearchExclusionsCache;
  let invalidateSpy: jest.SpiedFunction<SearchExclusionsCache['invalidate']>;
  let participationCommands: jest.Mocked<ParticipationCommandServiceClient>;
  let relationshipCommands: jest.Mocked<RelationshipCommandServiceClient>;
  let client: MockServicesClientGrpc;

  beforeEach(() => {
    cache = new SearchExclusionsCache();
    invalidateSpy = jest.spyOn(cache, 'invalidate');
    participationCommands = createMock<ParticipationCommandServiceClient>();
    relationshipCommands = createMock<RelationshipCommandServiceClient>();
    client = new MockServicesClientGrpc({
      [PARTICIPATION_COMMAND_SERVICE_NAME]: participationCommands,
      [PARTICIPATION_QUERY_SERVICE_NAME]: createMock<ParticipationQueryServiceClient>(),
      [RELATIONSHIP_COMMAND_SERVICE_NAME]: relationshipCommands,
      [RELATIONSHIP_QUERY_SERVICE_NAME]: createMock<RelationshipQueryServiceClient>(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('ParticipationCommandController (self)', () => {
    let controller: ParticipationCommandController;

    beforeEach(() => {
      controller = new ParticipationCommandController(client, cache);
      controller.onModuleInit();
    });

    it.each([
      ['participateSelf', 'postUserParticipateEvent'],
      ['unparticipateSelf', 'deleteUserParticipateEvent'],
      ['wishEventSelf', 'postUserWishEvent'],
      ['unwishEventSelf', 'deleteUserWishEvent'],
    ] as const)('%s should forget the caller once %s answered', async (route, rpc) => {
      jest.spyOn(participationCommands, rpc).mockReturnValue(of({}));

      await firstValueFrom(controller[route](eventId, me, req));

      expect(invalidateSpy).toHaveBeenCalledTimes(1);
      expect(invalidateSpy).toHaveBeenCalledWith(me.id);
    });

    it('should forget the caller when the write fails as well', async () => {
      jest
        .spyOn(participationCommands, 'postUserParticipateEvent')
        .mockReturnValue(throwError(() => new Error('deadline exceeded')));

      await expect(firstValueFrom(controller.participateSelf(eventId, me, req))).rejects.toThrow(
        'deadline exceeded',
      );
      expect(invalidateSpy).toHaveBeenCalledWith(me.id);
    });

    it('should not forget anything before the write answered', () => {
      jest.spyOn(participationCommands, 'postUserWishEvent').mockReturnValue(of({}));

      controller.wishEventSelf(eventId, me, req);

      expect(invalidateSpy).not.toHaveBeenCalled();
    });
  });

  describe('ParticipationAdminCommandController', () => {
    let controller: ParticipationAdminCommandController;

    beforeEach(() => {
      controller = new ParticipationAdminCommandController(client, cache);
      controller.onModuleInit();
    });

    it.each([
      ['ownEvent', 'postUserEvent'],
      ['disownEvent', 'deleteUserEvent'],
      ['participate', 'adminPostUserParticipateEvent'],
      ['unparticipate', 'adminDeleteUserParticipateEvent'],
      ['wishEvent', 'adminPostUserWishEvent'],
      ['unwishEvent', 'adminDeleteUserWishEvent'],
    ] as const)('%s should forget the target user once %s answered', async (route, rpc) => {
      jest.spyOn(participationCommands, rpc).mockReturnValue(of({}));

      await firstValueFrom(controller[route](otherId, eventId, req));

      expect(invalidateSpy).toHaveBeenCalledTimes(1);
      expect(invalidateSpy).toHaveBeenCalledWith(otherId);
    });
  });

  describe('RelationshipCommandController (self)', () => {
    let controller: RelationshipCommandController;

    beforeEach(() => {
      controller = new RelationshipCommandController(client, cache);
      controller.onModuleInit();
    });

    it.each([
      ['blockSelf', 'postBlockUser'],
      ['unblockSelf', 'deleteBlockUser'],
    ] as const)('%s should forget the blocker and the blocked user', async (route, rpc) => {
      jest.spyOn(relationshipCommands, rpc).mockReturnValue(of({}));

      await firstValueFrom(controller[route](otherId, me, req));

      expect(invalidateSpy).toHaveBeenCalledTimes(1);
      expect(invalidateSpy).toHaveBeenCalledWith(me.id, otherId);
    });

    it('should not forget anything on a follow', async () => {
      jest.spyOn(relationshipCommands, 'postFollowUser').mockReturnValue(of({}));

      await firstValueFrom(controller.followSelf(otherId, req));

      expect(invalidateSpy).not.toHaveBeenCalled();
    });
  });

  describe('RelationshipAdminCommandController', () => {
    let controller: RelationshipAdminCommandController;

    beforeEach(() => {
      controller = new RelationshipAdminCommandController(client, cache);
      controller.onModuleInit();
    });

    it.each([
      ['block', 'adminPostBlockUser'],
      ['unblock', 'adminDeleteBlockUser'],
    ] as const)('%s should forget the blocker and the blocked user', async (route, rpc) => {
      jest.spyOn(relationshipCommands, rpc).mockReturnValue(of({}));

      await firstValueFrom(controller[route]('user-blocker', otherId, req));

      expect(invalidateSpy).toHaveBeenCalledWith('user-blocker', otherId);
    });
  });

  it('should really drop the cached entries of both users of a block', async () => {
    const flags = SearchExclusionsFactory.createFlags();
    const response = SearchExclusionsFactory.createResponse();
    cache.set(me.id, flags, response);
    cache.set(otherId, flags, response);
    jest.spyOn(relationshipCommands, 'postBlockUser').mockReturnValue(of({}));
    const controller = new RelationshipCommandController(client, cache);
    controller.onModuleInit();

    await firstValueFrom(controller.blockSelf(otherId, me, req));

    expect(cache.get(me.id, flags)).toBeUndefined();
    expect(cache.get(otherId, flags)).toBeUndefined();
  });
});
