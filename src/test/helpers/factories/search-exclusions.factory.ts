import type { GetSearchExclusionsResponse } from '@volontariapp/contracts';
import type { SearchExclusionFlags } from '../../../modules/event/services/search-exclusions-cache.service.js';

export class SearchExclusionsFactory {
  static createResponse(
    overrides: Partial<GetSearchExclusionsResponse> = {},
  ): GetSearchExclusionsResponse {
    return {
      excludedEventIds: [],
      hiddenUserIds: [],
      excludedEventIdsTruncated: false,
      hiddenUserIdsTruncated: false,
      ...overrides,
    };
  }

  /** The four flags of the app list (`events-list-app`), every one set unless overridden. */
  static createFlags(overrides: Partial<SearchExclusionFlags> = {}): SearchExclusionFlags {
    return {
      excludeCreatedByMe: true,
      excludeParticipatedByMe: true,
      excludeWishedByMe: true,
      excludeBlockedUsers: true,
      ...overrides,
    };
  }
}
