import { ApiProperty } from '@nestjs/swagger';
import { SearchEventsResponse } from '@volontariapp/contracts-nest';
import { ListEventsWebResponse } from '@volontariapp/contracts';
import { PaginationResponseDTO } from '../../../../common/dto/response/index.js';
import { EventDTO } from '../common/index.js';

export class SearchEventsResponseDTO implements ListEventsWebResponse {
  static fromResponse(response: SearchEventsResponse): SearchEventsResponseDTO {
    const dto = new SearchEventsResponseDTO();
    dto.events = response.events.map((e) => EventDTO.fromResponse(e));
    dto.totalCount = response.totalCount;
    dto.pagination = {
      total: response.totalCount,
      page: 1,
      limit: 10,
      totalPages: Math.ceil(response.totalCount / 10) || 1,
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
