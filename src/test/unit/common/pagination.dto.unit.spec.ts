import 'reflect-metadata';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  FlatPaginationQueryDTO,
  LEGACY_MAX_LIMIT,
  MAX_LIMIT,
  PaginationRequestDTO,
  clampPaginationLimit,
  createFlatPaginationQueryDTO,
} from '../../../common/pagination/index.js';
import { GetFeedRequestDTO } from '../../../modules/social/dto/request/get-feed.request.dto.js';
import { GetMyLikesRequestDTO } from '../../../modules/social/dto/request/get-my-likes.request.dto.js';
import { GetUserLikesRequestDTO } from '../../../modules/social/dto/request/get-user-likes.request.dto.js';
import { GetUserEventsRequestDTO } from '../../../modules/social/dto/request/get-user-events.request.dto.js';
import { ListUsersRequestDTO } from '../../../modules/user/dto/request/list-users.request.dto.js';
import { ListBadgesRequestDTO } from '../../../modules/user/dto/request/list-badges.request.dto.js';
import { ListPostsRequestDTO } from '../../../modules/post/dto/request/list-posts.request.dto.js';
import { ListCommentsRequestDTO } from '../../../modules/post/dto/request/list-comments.request.dto.js';
import { SearchEventsRequestDTO } from '../../../modules/event/dto/request/search-events.request.dto.js';
import { InteractionQueryController } from '../../../modules/social/controllers/queries/interaction/interaction.query-controller.js';
import {
  createBothFormsPaginationQuery,
  createFlatPaginationQuery,
  createNestedPaginationQuery,
} from '../../helpers/factories/pagination.factory.js';

describe('Shared pagination (Unit)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('clampPaginationLimit', () => {
    it('should keep a limit under the cap and cap a larger one', () => {
      expect(clampPaginationLimit(10, MAX_LIMIT)).toBe(10);
      expect(clampPaginationLimit(5000, MAX_LIMIT)).toBe(MAX_LIMIT);
    });
  });

  describe('nested PaginationRequestDTO', () => {
    const parse = (value: Record<string, unknown>) => plainToInstance(PaginationRequestDTO, value);

    it('should convert strings to numbers', async () => {
      const dto = parse({ page: '2', limit: '25' });
      expect(await validate(dto)).toHaveLength(0);
      expect({ page: dto.page, limit: dto.limit }).toEqual({ page: 2, limit: 25 });
    });

    it('should apply the defaults when a value is missing', () => {
      expect(parse({ limit: '5' }).page).toBe(1);
      expect(parse({ page: '3' }).limit).toBe(10);
    });

    it('should cap 5000 at 100 without rejecting', async () => {
      const dto = parse({ page: '1', limit: '5000' });
      expect(await validate(dto)).toHaveLength(0);
      expect(dto.limit).toBe(MAX_LIMIT);
    });

    it.each(['0', '-5', 'abc', '2.5', '', 'Infinity'])('should reject limit=%p', async (limit) => {
      const errors = await validate(parse({ page: '1', limit }));
      expect(errors.map((e) => e.property)).toEqual(['limit']);
    });

    it.each(['0', '-1', 'abc', '1.5', ''])('should reject page=%p', async (page) => {
      const errors = await validate(parse({ page, limit: '10' }));
      expect(errors.map((e) => e.property)).toEqual(['page']);
    });
  });

  describe('flat query DTO', () => {
    class FlatDto extends FlatPaginationQueryDTO {}
    class FlatLegacyDto extends createFlatPaginationQueryDTO(LEGACY_MAX_LIMIT) {}

    it('should expose no pagination when neither page nor limit is sent', () => {
      expect(plainToInstance(FlatDto, {}).pagination).toBeUndefined();
    });

    it('should fill the missing half with the defaults', () => {
      expect(plainToInstance(FlatDto, { limit: '20' }).pagination).toEqual({ page: 1, limit: 20 });
      expect(plainToInstance(FlatDto, { page: '4' }).pagination).toEqual({ page: 4, limit: 10 });
    });

    it('should cap 5000 at 100 on a standard route and at 500 on a legacy route', async () => {
      const standard = plainToInstance(FlatDto, { page: '1', limit: '5000' });
      const legacy = plainToInstance(FlatLegacyDto, { page: '1', limit: '5000' });
      expect(await validate(standard)).toHaveLength(0);
      expect(await validate(legacy)).toHaveLength(0);
      expect(standard.pagination?.limit).toBe(MAX_LIMIT);
      expect(legacy.pagination?.limit).toBe(LEGACY_MAX_LIMIT);
    });

    it.each(['0', '-5', 'abc', '2.5'])('should reject limit=%p', async (limit) => {
      expect(await validate(plainToInstance(FlatDto, { limit }))).toHaveLength(1);
    });

    it('should not crash when a nested pagination key is sent to a flat DTO', async () => {
      const dto = plainToInstance(FlatDto, createBothFormsPaginationQuery('2', '20'));
      expect(await validate(dto)).toHaveLength(0);
      expect(dto.pagination).toEqual({ page: 2, limit: 20 });
    });
  });

  describe('route styles', () => {
    it('should validate and convert the nested social style (GetFeedRequestDTO)', async () => {
      const dto = plainToInstance(GetFeedRequestDTO, createNestedPaginationQuery('2', '5000'));
      expect(await validate(dto)).toHaveLength(0);
      expect(dto.toQuery()).toEqual({ pagination: { page: 2, limit: MAX_LIMIT } });
    });

    it('should reject an invalid nested value (GetFeedRequestDTO)', async () => {
      const dto = plainToInstance(GetFeedRequestDTO, createNestedPaginationQuery('0', '10'));
      expect(await validate(dto)).toHaveLength(1);
    });

    it('should reject a nested pagination that is not an object', async () => {
      const dto = plainToInstance(GetFeedRequestDTO, { pagination: '5' });
      expect(await validate(dto)).toHaveLength(1);
    });

    it('should cap other nested routes at 100 (admin likes of a user)', () => {
      const dto = plainToInstance(GetUserLikesRequestDTO, createNestedPaginationQuery('1', '500'));
      expect(dto.toQuery()).toEqual({ pagination: { page: 1, limit: MAX_LIMIT } });
    });

    it('should keep 500 on GET /social/likes and give the same query with both forms', async () => {
      const both = plainToInstance(
        GetMyLikesRequestDTO,
        createBothFormsPaginationQuery('1', '500'),
      );
      const nested = plainToInstance(GetMyLikesRequestDTO, createNestedPaginationQuery('1', '500'));
      expect(await validate(both)).toHaveLength(0);
      expect(both.toQuery()).toEqual({ pagination: { page: 1, limit: 500 } });
      expect(both.toQuery()).toEqual(nested.toQuery());
    });

    it('should cap GET /social/likes at 500', () => {
      const dto = plainToInstance(GetMyLikesRequestDTO, createNestedPaginationQuery('1', '5000'));
      expect(dto.toQuery().pagination?.limit).toBe(LEGACY_MAX_LIMIT);
    });

    it('should bind the legacy DTO to GET /social/likes and not to the post likers route', () => {
      const likesParams: unknown = Reflect.getMetadata(
        'design:paramtypes',
        InteractionQueryController.prototype,
        'getUserLikesSelf',
      );
      const likersParams: unknown = Reflect.getMetadata(
        'design:paramtypes',
        InteractionQueryController.prototype,
        'getPostLikers',
      );
      expect(likesParams).toEqual(expect.arrayContaining([GetMyLikesRequestDTO]));
      expect(likersParams).not.toEqual(expect.arrayContaining([GetMyLikesRequestDTO]));
    });

    it('should handle the flat social style (GetUserEventsRequestDTO)', async () => {
      const dto = plainToInstance(GetUserEventsRequestDTO, createFlatPaginationQuery('3', '5000'));
      expect(await validate(dto)).toHaveLength(0);
      expect(dto.toQuery()).toEqual({ pagination: { page: 3, limit: MAX_LIMIT } });
    });

    it('should accept both forms on GET /users and produce the same query', async () => {
      const flat = plainToInstance(ListUsersRequestDTO, createFlatPaginationQuery('1', '500'));
      const nested = plainToInstance(ListUsersRequestDTO, createNestedPaginationQuery('1', '500'));
      const both = plainToInstance(ListUsersRequestDTO, createBothFormsPaginationQuery('1', '500'));
      for (const dto of [flat, nested, both]) {
        expect(await validate(dto)).toHaveLength(0);
        expect(dto.toQuery()).toEqual({ pagination: { page: 1, limit: 500 } });
      }
    });

    it('should cap GET /users at 500 and keep its defaults', () => {
      const capped = plainToInstance(ListUsersRequestDTO, createFlatPaginationQuery('1', '5000'));
      expect(capped.toQuery().pagination?.limit).toBe(LEGACY_MAX_LIMIT);
      expect(plainToInstance(ListUsersRequestDTO, {}).toQuery()).toEqual({ pagination: undefined });
      expect(plainToInstance(ListUsersRequestDTO, { page: '2' }).toQuery()).toEqual({
        pagination: { page: 2, limit: 50 },
      });
    });

    it('should cap GET /badges at 100', () => {
      const dto = plainToInstance(ListBadgesRequestDTO, createNestedPaginationQuery('1', '500'));
      expect(dto.toQuery()).toEqual({ pagination: { limit: MAX_LIMIT, page: 1 } });
    });

    it('should default and cap GET /posts', async () => {
      expect(plainToInstance(ListPostsRequestDTO, {}).toQuery().pagination).toEqual({
        page: 1,
        limit: 10,
      });
      const dto = plainToInstance(ListPostsRequestDTO, createFlatPaginationQuery('1', '5000'));
      expect(dto.toQuery().pagination?.limit).toBe(MAX_LIMIT);
      expect(
        await validate(plainToInstance(ListPostsRequestDTO, createFlatPaginationQuery('1', 'abc'))),
      ).toHaveLength(1);
    });

    it('should default, cap and reject on GET /posts/:postId/comments', async () => {
      expect(plainToInstance(ListCommentsRequestDTO, {}).toQuery().pagination).toEqual({
        page: 1,
        limit: 10,
      });
      const dto = plainToInstance(ListCommentsRequestDTO, createFlatPaginationQuery('1', '5000'));
      expect(dto.toQuery().pagination?.limit).toBe(MAX_LIMIT);
      expect(
        await validate(
          plainToInstance(ListCommentsRequestDTO, createFlatPaginationQuery('0', '10')),
        ),
      ).toHaveLength(1);
    });

    it('should default, cap and reject on GET /events', async () => {
      expect(plainToInstance(SearchEventsRequestDTO, {}).toQuery().pagination).toEqual({
        page: 1,
        limit: 10,
      });
      const dto = plainToInstance(SearchEventsRequestDTO, createFlatPaginationQuery('2', '5000'));
      expect(dto.toQuery().pagination).toEqual({ page: 2, limit: MAX_LIMIT });
      expect(
        await validate(
          plainToInstance(SearchEventsRequestDTO, createFlatPaginationQuery('1', '2.5')),
        ),
      ).toHaveLength(1);
    });
  });
});
