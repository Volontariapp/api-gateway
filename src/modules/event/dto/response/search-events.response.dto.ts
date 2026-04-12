import { ApiProperty } from '@nestjs/swagger';
import { SearchEventsResponse } from '@volontariapp/contracts-nest';
import { ListEventsWebResponse } from '@volontariapp/contracts';
import { EventDTO } from '../common/event.dto.js';

export class SearchEventsResponseDTO
  implements SearchEventsResponse, ListEventsWebResponse
{
  @ApiProperty({ type: [EventDTO] })
  events!: EventDTO[];

  @ApiProperty({ example: 100 })
  totalCount!: number;
}
