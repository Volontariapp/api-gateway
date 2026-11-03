import 'reflect-metadata';
import { jest } from '@jest/globals';
import { firstValueFrom, of } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';
import { validate } from 'class-validator';
import {
  INTERACTION_COMMAND_SERVICE_NAME,
  INTERACTION_QUERY_SERVICE_NAME,
  type InteractionCommandServiceClient,
  type InteractionQueryServiceClient,
} from '@volontariapp/contracts-nest';
import { createMock } from '@volontariapp/testing';
import { InteractionQueryController } from '../../../../modules/social/controllers/queries/interaction/interaction.query-controller.js';
import {
  GetPostsLikeSummaryRequestDTO,
  MAX_LIKE_SUMMARY_POST_IDS,
} from '../../../../modules/social/dto/request/get-posts-like-summary.request.dto.js';
import { MockServicesClientGrpc } from '../../../helpers/mocks/services-client-grpc.mock.js';
import {
  createGetPostsLikeSummaryResponseFactory,
  createPostIdsFactory,
} from '../../../helpers/factories/like-summary.factory.js';

const buildDto = (postIds: string[]): GetPostsLikeSummaryRequestDTO => {
  const dto = new GetPostsLikeSummaryRequestDTO();
  dto.postIds = postIds;
  return dto;
};

describe('Posts like summary (Unit)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GetPostsLikeSummaryRequestDTO', () => {
    it('should accept 1 to 100 distinct ids', async () => {
      expect(await validate(buildDto(createPostIdsFactory(1)))).toHaveLength(0);
      expect(
        await validate(buildDto(createPostIdsFactory(MAX_LIKE_SUMMARY_POST_IDS))),
      ).toHaveLength(0);
    });

    it('should reject more than 100 ids', async () => {
      const errors = await validate(buildDto(createPostIdsFactory(MAX_LIKE_SUMMARY_POST_IDS + 1)));
      expect(errors.map((e) => e.property)).toEqual(['postIds']);
    });

    it('should reject an empty list', async () => {
      const errors = await validate(buildDto([]));
      expect(errors.map((e) => e.property)).toEqual(['postIds']);
    });

    it('should reject duplicate ids', async () => {
      const errors = await validate(buildDto(['post-1', 'post-1']));
      expect(errors.map((e) => e.property)).toEqual(['postIds']);
    });

    it('should reject non-string ids and a missing body', async () => {
      const numeric = buildDto([]);
      Reflect.set(numeric, 'postIds', [1]);
      expect(await validate(numeric)).toHaveLength(1);
      expect(await validate(new GetPostsLikeSummaryRequestDTO())).toHaveLength(1);
    });
  });

  describe('InteractionQueryController.getPostsLikeSummarySelf', () => {
    it('should forward the ids and the internal metadata to ms-social', async () => {
      const metadata = new Metadata();
      const queryService = createMock<InteractionQueryServiceClient>();
      const response = createGetPostsLikeSummaryResponseFactory();
      const spy = jest.spyOn(queryService, 'getPostsLikeSummary').mockReturnValue(of(response));
      const controller = new InteractionQueryController(
        new MockServicesClientGrpc({
          [INTERACTION_COMMAND_SERVICE_NAME]: createMock<InteractionCommandServiceClient>(),
          [INTERACTION_QUERY_SERVICE_NAME]: queryService,
        }),
      );
      controller.onModuleInit();

      const result = await firstValueFrom(
        controller.getPostsLikeSummarySelf(buildDto(['post-1', 'post-2']), {
          internalMetadata: metadata,
        }),
      );

      expect(spy).toHaveBeenCalledWith({ postIds: ['post-1', 'post-2'] }, metadata);
      expect(result).toEqual(response);
    });
  });
});
