import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { GatewayTimeoutException } from '@nestjs/common';
import { Metadata } from '@grpc/grpc-js';
import { firstValueFrom, of, throwError } from 'rxjs';
import {
  EVENT_QUERY_SERVICE_NAME,
  POST_SERVICE_NAME,
  RELATIONSHIP_COMMAND_SERVICE_NAME,
  RELATIONSHIP_QUERY_SERVICE_NAME,
  USER_SERVICE_NAME,
  type EventQueryServiceClient,
  type PostServiceClient,
  type RelationshipCommandServiceClient,
  type RelationshipQueryServiceClient,
  type UserServiceClient,
} from '@volontariapp/contracts-nest';
import type { AuthUser } from '@volontariapp/auth';
import { createMock } from '@volontariapp/testing';
import type { WithMetadata } from '../../../common/types/grpc.types.js';
import { DEFAULT_GRPC_READ_DEADLINE_MS } from '../../../common/grpc/read-deadline.js';
import { PostQueryController } from '../../../modules/post/controllers/queries/post/post.query-controller.js';
import { ListPostsRequestDTO } from '../../../modules/post/dto/request/index.js';
import { UserQueryController } from '../../../modules/user/controllers/queries/user/user.query-controller.js';
import { RelationshipQueryController } from '../../../modules/social/controllers/queries/relationship/relationship.query-controller.js';
import { RelationshipCommandController } from '../../../modules/social/controllers/commands/relationship/relationship.command-controller.js';
import type { EventLookupService } from '../../../modules/event/services/event-lookup.service.js';
import { SearchExclusionsCache } from '../../../modules/event/services/search-exclusions-cache.service.js';
import { MockServicesClientGrpc } from '../../helpers/mocks/services-client-grpc.mock.js';
import { setupVolontariappLoggerMock } from '../../helpers/mocks/volontariapp-logger.mock.js';
import { PublicFileUrlFactory } from '../../helpers/factories/public-file-url.factory.js';
import { UserFactory } from '../../helpers/factories/user.factory.js';
import { createGrpcErrorFactory } from '../../helpers/factories/grpc-error.factory.js';

const NOW = 1_800_000_000_000;
const USER_ID = '123e4567-e89b-12d3-a456-426614174000';

describe('gRPC read deadlines on the hot routes (Unit)', () => {
  const metadata = new Metadata();
  const req = { internalMetadata: metadata };
  const urls = PublicFileUrlFactory.createService('https://cdn.test/pub');
  const readOptions = { deadline: NOW + DEFAULT_GRPC_READ_DEADLINE_MS };
  let postService: jest.Mocked<WithMetadata<PostServiceClient>>;
  let userService: jest.Mocked<WithMetadata<UserServiceClient>>;
  let relationshipQuery: jest.Mocked<WithMetadata<RelationshipQueryServiceClient>>;
  let relationshipCommand: jest.Mocked<WithMetadata<RelationshipCommandServiceClient>>;
  let clients: MockServicesClientGrpc;

  beforeEach(() => {
    setupVolontariappLoggerMock();
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
    postService = createMock<WithMetadata<PostServiceClient>>();
    userService = createMock<WithMetadata<UserServiceClient>>();
    relationshipQuery = createMock<WithMetadata<RelationshipQueryServiceClient>>();
    relationshipCommand = createMock<WithMetadata<RelationshipCommandServiceClient>>();
    clients = new MockServicesClientGrpc({
      [EVENT_QUERY_SERVICE_NAME]: createMock<WithMetadata<EventQueryServiceClient>>(),
      [POST_SERVICE_NAME]: postService,
      [USER_SERVICE_NAME]: userService,
      [RELATIONSHIP_QUERY_SERVICE_NAME]: relationshipQuery,
      [RELATIONSHIP_COMMAND_SERVICE_NAME]: relationshipCommand,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('posts-list: ListPosts gets a deadline', async () => {
    const controller = new PostQueryController(
      clients,
      clients,
      urls,
      createMock<EventLookupService>(),
    );
    controller.onModuleInit();
    const spy = jest
      .spyOn(postService, 'listPosts')
      .mockReturnValue(of({ posts: [], pagination: undefined }));

    await controller.listPosts(new ListPostsRequestDTO(), req);

    expect(spy).toHaveBeenCalledWith(expect.anything(), metadata, readOptions);
  });

  it('me: GetUser gets a deadline', async () => {
    const controller = new UserQueryController(clients, urls);
    controller.onModuleInit();
    const spy = jest
      .spyOn(userService, 'getUser')
      .mockReturnValue(of({ user: UserFactory.createUser({ id: USER_ID }) }));
    const user: AuthUser = { id: USER_ID, role: 'VOLUNTEER' };

    await firstValueFrom(controller.getMe(user, req));

    expect(spy).toHaveBeenCalledWith({ userId: USER_ID }, metadata, readOptions);
  });

  it('me: a DEADLINE_EXCEEDED from ms-user becomes a gateway timeout', async () => {
    const controller = new UserQueryController(clients, urls);
    controller.onModuleInit();
    jest.spyOn(userService, 'getUser').mockReturnValue(throwError(() => createGrpcErrorFactory()));
    const user: AuthUser = { id: USER_ID, role: 'VOLUNTEER' };

    await expect(firstValueFrom(controller.getMe(user, req))).rejects.toBeInstanceOf(
      GatewayTimeoutException,
    );
  });

  it('is-following: GetIsFollowing gets a deadline', async () => {
    const controller = new RelationshipQueryController(clients, clients, urls);
    controller.onModuleInit();
    const spy = jest
      .spyOn(relationshipQuery, 'getIsFollowing')
      .mockReturnValue(of({ isFollowing: true }));

    await expect(firstValueFrom(controller.getIsFollowing(USER_ID, req))).resolves.toEqual({
      isFollowing: true,
    });
    expect(spy).toHaveBeenCalledWith({ userId: USER_ID }, metadata, readOptions);
  });

  it('a command (follow) gets no deadline: an interrupted write keeps running server side', async () => {
    const controller = new RelationshipCommandController(clients, new SearchExclusionsCache());
    controller.onModuleInit();
    const spy = jest.spyOn(relationshipCommand, 'postFollowUser').mockReturnValue(of({}));

    await firstValueFrom(controller.followSelf(USER_ID, req));

    expect(spy).toHaveBeenCalledWith({ followedId: USER_ID }, metadata);
    expect(spy.mock.calls[0]).toHaveLength(2);
  });
});
