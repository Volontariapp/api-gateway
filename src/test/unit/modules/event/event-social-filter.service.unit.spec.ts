import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Metadata } from '@grpc/grpc-js';
import { of, throwError } from 'rxjs';
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
import { SearchEventsRequestDTO } from '../../../../modules/event/dto/request/index.js';
import { MockServicesClientGrpc } from '../../../helpers/mocks/services-client-grpc.mock.js';
import { IdsPageFactory } from '../../../helpers/factories/ids-page.factory.js';

describe('EventSocialFilterService (Unit)', () => {
  let participationQuery: jest.Mocked<WithMetadata<ParticipationQueryServiceClient>>;
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
    service = new EventSocialFilterService(
      new MockServicesClientGrpc({ [PARTICIPATION_QUERY_SERVICE_NAME]: participationQuery }),
    );
    service.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should not restrict the search without any social filter', async () => {
    const recommendedSpy = jest.spyOn(participationQuery, 'getRecommendedEventIds');
    const exclusionsSpy = jest.spyOn(participationQuery, 'getSearchExclusions');

    await expect(service.resolve(searchWith({}), metadata)).resolves.toEqual({ kind: 'none' });
    expect(recommendedSpy).not.toHaveBeenCalled();
    expect(exclusionsSpy).not.toHaveBeenCalled();
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

  describe('exclusion filters', () => {
    const exclusionsOf = (overrides: {
      excludedEventIds?: string[];
      hiddenUserIds?: string[];
      excludedEventIdsTruncated?: boolean;
      hiddenUserIdsTruncated?: boolean;
    }) =>
      of({
        excludedEventIds: [],
        hiddenUserIds: [],
        excludedEventIdsTruncated: false,
        hiddenUserIdsTruncated: false,
        ...overrides,
      });

    it('should read my exclusions with one call and send them to ms-event', async () => {
      const events = IdsPageFactory.createIds(3, 0);
      const hidden = IdsPageFactory.createIds(2, 7);
      const exclusionsSpy = jest
        .spyOn(participationQuery, 'getSearchExclusions')
        .mockReturnValue(exclusionsOf({ excludedEventIds: events, hiddenUserIds: hidden }));
      const recommendedSpy = jest.spyOn(participationQuery, 'getRecommendedEventIds');
      const createdSpy = jest.spyOn(participationQuery, 'getUserEvent');
      const participatedSpy = jest.spyOn(participationQuery, 'getUserParticipateEvent');
      const wishedSpy = jest.spyOn(participationQuery, 'getUserWishEvent');

      const scope = await service.resolve(
        searchWith({
          excludeCreatedByMe: true,
          excludeParticipatedByMe: true,
          excludeWishedByMe: true,
          excludeBlockedUsers: true,
        }),
        metadata,
      );

      expect(exclusionsSpy).toHaveBeenCalledTimes(1);
      expect(exclusionsSpy).toHaveBeenCalledWith(
        {
          excludeCreatedByMe: true,
          excludeParticipatedByMe: true,
          excludeWishedByMe: true,
          excludeBlockedUsers: true,
        },
        metadata,
      );
      expect(recommendedSpy).not.toHaveBeenCalled();
      expect(createdSpy).not.toHaveBeenCalled();
      expect(participatedSpy).not.toHaveBeenCalled();
      expect(wishedSpy).not.toHaveBeenCalled();
      expect(scope).toEqual({
        kind: 'excluded',
        excludedIds: events,
        excludedOrganizerIds: hidden,
      });
    });

    it('should ask only for the filters of the request', async () => {
      const exclusionsSpy = jest
        .spyOn(participationQuery, 'getSearchExclusions')
        .mockReturnValue(exclusionsOf({}));

      await service.resolve(searchWith({ excludeWishedByMe: true }), metadata);

      expect(exclusionsSpy).toHaveBeenCalledWith(
        {
          excludeCreatedByMe: false,
          excludeParticipatedByMe: false,
          excludeWishedByMe: true,
          excludeBlockedUsers: false,
        },
        metadata,
      );
    });

    it('should send every hidden user, in both directions, as an excluded organizer', async () => {
      const hidden = IdsPageFactory.createIds(2, 7);
      jest
        .spyOn(participationQuery, 'getSearchExclusions')
        .mockReturnValue(exclusionsOf({ hiddenUserIds: hidden }));

      const scope = await service.resolve(searchWith({ excludeBlockedUsers: true }), metadata);

      expect(scope).toEqual({ kind: 'excluded', excludedIds: [], excludedOrganizerIds: hidden });
    });

    it('should not restrict the search when there is nothing to exclude', async () => {
      jest.spyOn(participationQuery, 'getSearchExclusions').mockReturnValue(exclusionsOf({}));

      await expect(
        service.resolve(searchWith({ excludeWishedByMe: true }), metadata),
      ).resolves.toEqual({ kind: 'none' });
    });

    it('should drop the ids that are not UUIDs', async () => {
      const [valid] = IdsPageFactory.createIds(1, 0);
      jest
        .spyOn(participationQuery, 'getSearchExclusions')
        .mockReturnValue(
          exclusionsOf({ excludedEventIds: ['', 'not-a-uuid', valid], hiddenUserIds: ['x'] }),
        );

      const scope = await service.resolve(
        searchWith({ excludeCreatedByMe: true, excludeBlockedUsers: true }),
        metadata,
      );

      expect(scope).toEqual({ kind: 'excluded', excludedIds: [valid], excludedOrganizerIds: [] });
    });

    it('should cut a list longer than the ms-event cap', async () => {
      jest
        .spyOn(participationQuery, 'getSearchExclusions')
        .mockReturnValue(
          exclusionsOf({ excludedEventIds: IdsPageFactory.createIds(MAX_SEARCH_IDS + 5) }),
        );

      const scope = await service.resolve(searchWith({ excludeParticipatedByMe: true }), metadata);

      expect(scope).toEqual({
        kind: 'excluded',
        excludedIds: IdsPageFactory.createIds(MAX_SEARCH_IDS),
        excludedOrganizerIds: [],
      });
    });

    it('should still answer when ms-social reports a truncated list', async () => {
      const events = IdsPageFactory.createIds(MAX_SEARCH_IDS);
      jest
        .spyOn(participationQuery, 'getSearchExclusions')
        .mockReturnValue(
          exclusionsOf({ excludedEventIds: events, excludedEventIdsTruncated: true }),
        );

      const scope = await service.resolve(searchWith({ excludeCreatedByMe: true }), metadata);

      expect(scope).toEqual({ kind: 'excluded', excludedIds: events, excludedOrganizerIds: [] });
    });

    it('should not swallow an ms-social failure', async () => {
      jest
        .spyOn(participationQuery, 'getSearchExclusions')
        .mockReturnValue(throwError(() => new Error('ms-social down')));

      await expect(
        service.resolve(searchWith({ excludeBlockedUsers: true }), metadata),
      ).rejects.toThrow('ms-social down');
    });
  });
});
