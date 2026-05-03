import { ApiProperty } from '@nestjs/swagger';
import { SearchEventsResponse } from '@volontariapp/contracts-nest';
import { ListEventsWebResponse } from '@volontariapp/contracts';
import { PaginationResponseDTO } from '../../../../common/dto/response/index.js';
import { EventDTO } from '../common/index.js';

export class SearchEventsResponseDTO implements ListEventsWebResponse {
  static fromResponse(
    response: SearchEventsResponse,
    page: number = 1,
    limit: number = 10,
  ): SearchEventsResponseDTO {
    const dto = new SearchEventsResponseDTO();
    dto.events = response.events.map((e) => EventDTO.fromResponse(e));
    dto.totalCount = response.totalCount;
    dto.pagination = {
      total: response.totalCount,
      page,
      limit,
      totalPages: Math.ceil(response.totalCount / limit) || 1,
    };
    return dto;
  }

  @ApiProperty({ type: [EventDTO] })
  events!: EventDTO[];

  @ApiProperty({ example: 100 })
  totalCount!: number;

  @ApiProperty({ type: PaginationResponseDTO })
  pagination!: PaginationResponseDTO;
}
