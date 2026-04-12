import { ApiProperty } from '@nestjs/swagger';
import { SearchEventsResponse } from '@volontariapp/contracts-nest';
import { ListEventsWebResponse } from '@volontariapp/contracts';
import { EventDTO } from '../common/index.js';
import { PaginationResponseDTO } from '../../../../common/dto/response/index.js';

export class SearchEventsResponseDTO
  implements SearchEventsResponse, ListEventsWebResponse
{
  @ApiProperty({ type: [EventDTO] })
  events!: EventDTO[];

  @ApiProperty({ example: 100 })
  totalCount!: number;

  @ApiProperty({ type: PaginationResponseDTO })
  pagination!: PaginationResponseDTO;
}
