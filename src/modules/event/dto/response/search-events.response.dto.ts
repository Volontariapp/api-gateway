import { ApiProperty } from '@nestjs/swagger';
import { SearchEventsResponse } from '@volontariapp/contracts-nest';
import { ListEventsWebResponse } from '@volontariapp/contracts';
import { PaginationResponseDTO } from '../../../../common/dto/response/index.js';
import { EventDTO } from '../common/index.js';
import type { EventCoverUrlBuilder } from '../common/event-cover-url.builder.js';

export class SearchEventsResponseDTO implements ListEventsWebResponse {
  static fromResponse(
    response: SearchEventsResponse,
    urls: EventCoverUrlBuilder,
    page: number = 1,
    limit: number = 10,
  ): SearchEventsResponseDTO {
    const dto = new SearchEventsResponseDTO();
    dto.events = response.events.map((e) => EventDTO.fromResponse(e, urls));
    dto.totalCount = response.totalCount;
    // Pagination du ms quand presente; repli sur l echo de la requete pour un ms plus ancien.
    dto.pagination = response.pagination ?? {
      total: response.totalCount,
      page,
      limit,
      totalPages: Math.ceil(response.totalCount / limit) || 1,
    };
    return dto;
  }

  /** Reponse vide (aucun id a chercher): pagination coherente, sans appel a ms-event. */
  static empty(page: number = 1, limit: number = 10): SearchEventsResponseDTO {
    const dto = new SearchEventsResponseDTO();
    dto.events = [];
    dto.totalCount = 0;
    dto.pagination = { total: 0, page, limit, totalPages: 0 };
    return dto;
  }

  @ApiProperty({ type: [EventDTO] })
  events!: EventDTO[];

  @ApiProperty({ example: 100 })
  totalCount!: number;

  @ApiProperty({ type: PaginationResponseDTO })
  pagination!: PaginationResponseDTO;
}
