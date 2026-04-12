import { ApiProperty } from '@nestjs/swagger';
import type { CreateEventResponse } from '@volontariapp/contracts-nest';
import type { EventWebResponse } from '@volontariapp/contracts';
import { EventDTO } from '../common/event.dto.js';

export class CreateEventResponseDTO
  implements CreateEventResponse, EventWebResponse
{
  @ApiProperty({ type: EventDTO, required: true })
  event!: EventDTO;
}
