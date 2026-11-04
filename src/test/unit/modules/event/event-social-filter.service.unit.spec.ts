import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Metadata } from '@grpc/grpc-js';
import { of } from 'rxjs';
import {
  PARTICIPATION_QUERY_SERVICE_NAME,
  type ParticipationQueryServiceClient,
} from '@volontariapp/contracts-nest';
import type { PaginationRequest } from '@volontariapp/contracts';
import { createMock } from '@volontariapp/testing';
import type { WithMetadata } from '../../../../common/types/grpc.types.js';
import {
  EventSocialFilterService,
  MAX_SEARCH_IDS,
} from '../../../../modules/event/services/event-social-filter.service.js';
import type { HiddenUsersService } from '../../../../modules/event/services/hidden-users.service.js';
import { SearchEventsRequestDTO } from '../../../../modules/event/dto/request/index.js';
import { MockServicesClientGrpc } from '../../../helpers/mocks/services-client-grpc.mock.js';
import { IdsPageFactory } from '../../../helpers/factories/ids-page.factory.js';

describe('EventSocialFilterService (Unit)', () => {
  let participationQuery: jest.Mocked<WithMetadata<ParticipationQueryServiceClient>>;
  let hiddenUsers: jest.Mocked<HiddenUsersService>;
  let service: EventSocialFilterService;
  const metadata = new Metadata();
  const searchWith = (filters: Partial<SearchEventsRequestDTO>) =>
    Object.assign(new SearchEventsRequestDTO(), filters);
  const pageOf =
    (total: number) =>
    ({ pagination }: { pagination: PaginationRequest | undefined }) =>
      of(IdsPageFactory.createPage(total, pagination?.page ?? 1, pagination?.limit ?? 100));

  beforeEach(() => {
    participationQuery = createMock<WithMetadata<ParticipationQueryServiceClient>>();
    hiddenUsers = createMock<HiddenUsersService>();
    service = new EventSocialFilterService(
      new MockServicesClientGrpc({ [PARTICIPATION_QUERY_SERVICE_NAME]: participationQuery }),
      hiddenUsers,
    );
    service.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should not restrict the search without any social filter', async () => {
    const recommendedSpy = jest.spyOn(participationQuery, 'getRecommendedEventIds');

    await expect(service.resolve(searchWith({}), metadata)).resolves.toEqual({ kind: 'none' });
    expect(recommendedSpy).not.toHaveBeenCalled();
  });

  it('should read every page of the friends recommendation and send it as ids', async () => {
    const recommendedSpy = jest
      .spyOn(participationQuery, 'getRecommendedEventIds')
      .mockImplementation(pageOf(250));

    const scope = await service.resolve(
      searchWith({ excludeCreatedByMe: false, onlyParticipatedByFriends: true }),
      metadata,
    );

    expect(recommendedSpy).toHaveBeenCalledTimes(3);
    expect(recommendedSpy).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        excludeCreatedByMe: false,
        onlyParticipatedByFriends: true,
        pagination: { page: 3, limit: 100 },
      }),
      metadata,
    );
    expect(scope).toEqual({ kind: 'ids', ids: IdsPageFactory.createIds(250) });
  });

  it('should cut the friends recommendation to the ms-event cap', async () => {
    jest
      .spyOn(participationQuery, 'getRecommendedEventIds')
      .mockImplementation(pageOf(MAX_SEARCH_IDS + 5));

    const scope = await service.resolve(searchWith({ onlyWishedByFriends: true }), metadata);

    expect(scope).toEqual({ kind: 'ids', ids: IdsPageFactory.createIds(MAX_SEARCH_IDS) });
  });

  it('should answer empty when no recommended id is a UUID', async () => {
    jest
      .spyOn(participationQuery, 'getRecommendedEventIds')
      .mockReturnValue(of({ ids: ['', 'not-a-uuid'], pagination: undefined }));

    await expect(
      service.resolve(searchWith({ onlyCreatedByFriends: true }), metadata),
    ).resolves.toEqual({ kind: 'empty' });
  });

  it('should send my own lists as excludedIds without reading the recommendation', async () => {
    const [created, participated, wished] = [
      IdsPageFactory.createIds(2, 0),
      IdsPageFactory.createIds(2, 1),
      IdsPageFactory.createIds(1, 10),
    ];
    const recommendedSpy = jest.spyOn(participationQuery, 'getRecommendedEventIds');
    jest
      .spyOn(participationQuery, 'getUserEvent')
      .mockReturnValue(of({ ids: created, pagination: undefined }));
    jest
      .spyOn(participationQuery, 'getUserParticipateEvent')
      .mockReturnValue(of({ ids: participated, pagination: undefined }));
    jest
      .spyOn(participationQuery, 'getUserWishEvent')
      .mockReturnValue(of({ ids: wished, pagination: undefined }));

    const scope = await service.resolve(
      searchWith({
        excludeCreatedByMe: true,
        excludeParticipatedByMe: true,
        excludeWishedByMe: true,
      }),
      metadata,
    );

    expect(recommendedSpy).not.toHaveBeenCalled();
    expect(scope).toEqual({
      kind: 'excluded',
      excludedIds: [...IdsPageFactory.createIds(3, 0), ...wished],
    });
  });

  it('should exclude the events created by every hidden user', async () => {
    jest.spyOn(hiddenUsers, 'hiddenUserIds').mockResolvedValue(new Set(['blocked', 'blocker']));
    const byUser: Record<string, string[]> = {
      blocked: IdsPageFactory.createIds(1, 0),
      blocker: IdsPageFactory.createIds(1, 1),
    };
    const adminSpy = jest
      .spyOn(participationQuery, 'adminGetUserEvent')
      .mockImplementation(({ userId }) => of({ ids: byUser[userId], pagination: undefined }));

    const scope = await service.resolve(searchWith({ excludeBlockedUsers: true }), metadata);

    expect(adminSpy).toHaveBeenCalledWith(
      { userId: 'blocked', pagination: { page: 1, limit: 100 } },
      metadata,
    );
    expect(scope).toEqual({ kind: 'excluded', excludedIds: IdsPageFactory.createIds(2) });
  });

  it('should not restrict the search when there is nothing to exclude', async () => {
    jest
      .spyOn(participationQuery, 'getUserWishEvent')
      .mockReturnValue(of({ ids: [], pagination: undefined }));

    await expect(
      service.resolve(searchWith({ excludeWishedByMe: true }), metadata),
    ).resolves.toEqual({ kind: 'none' });
  });

  it('should cut the exclusions to the ms-event cap', async () => {
    jest
      .spyOn(participationQuery, 'getUserParticipateEvent')
      .mockImplementation(pageOf(MAX_SEARCH_IDS + 1));

    const scope = await service.resolve(searchWith({ excludeParticipatedByMe: true }), metadata);

    expect(scope).toEqual({
      kind: 'excluded',
      excludedIds: IdsPageFactory.createIds(MAX_SEARCH_IDS),
    });
  });
});
