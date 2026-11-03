import { describe, expect, it } from '@jest/globals';
import type { SearchEventsResponse } from '@volontariapp/contracts-nest';
import { SearchEventsResponseDTO } from '../../../../modules/event/dto/response/search-events.response.dto.js';
import { EventCoverUrlBuilderMock } from '../../../helpers/mocks/event-cover-url-builder.mock.js';
import { EventFactory } from '../../../helpers/factories/event.factory.js';

const urls = new EventCoverUrlBuilderMock();

const buildResponse = (overrides: Partial<SearchEventsResponse> = {}): SearchEventsResponse => ({
  events: [EventFactory.createEvent()],
  totalCount: 25,
  pagination: undefined,
  ...overrides,
});

describe('SearchEventsResponseDTO pagination (Unit)', () => {
  it('should use the pagination sent by ms-event when present', () => {
    const pagination = { total: 25, page: 2, limit: 10, totalPages: 3 };

    const dto = SearchEventsResponseDTO.fromResponse(buildResponse({ pagination }), urls, 9, 99);

    expect(dto.pagination).toEqual(pagination);
    expect(dto.totalCount).toBe(25);
  });

  it('should fall back to the request echo when ms-event sends no pagination', () => {
    const dto = SearchEventsResponseDTO.fromResponse(buildResponse(), urls, 2, 10);

    expect(dto.pagination).toEqual({ total: 25, page: 2, limit: 10, totalPages: 3 });
  });

  it('should build a coherent empty response for the no-id case', () => {
    const dto = SearchEventsResponseDTO.empty(3, 20);

    expect(dto.events).toEqual([]);
    expect(dto.totalCount).toBe(0);
    expect(dto.pagination).toEqual({ total: 0, page: 3, limit: 20, totalPages: 0 });
  });
});
