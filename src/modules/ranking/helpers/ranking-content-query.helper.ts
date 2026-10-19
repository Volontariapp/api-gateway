import { EventState, type SearchEventsQuery } from '@volontariapp/contracts-nest';

/**
 * Search of the events of one ranking page. The pagination is explicit and equal to the number of
 * ids: the repository default is 10 and would silently cut a page of 20.
 */
export function buildRankedEventsSearchQuery(ids: readonly string[]): SearchEventsQuery {
  return {
    area: undefined,
    types: [],
    tagSlugs: [],
    onlyAvailable: false,
    searchTerm: '',
    organizerId: '',
    ids: [...ids],
    excludedIds: [],
    statuses: [EventState.EVENT_STATE_PUBLISHED],
    pagination: { page: 1, limit: ids.length },
  };
}
