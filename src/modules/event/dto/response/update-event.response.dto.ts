import { ApiProperty } from '@nestjs/swagger';
import type { UpdateEventResponse } from '@volontariapp/contracts-nest';
import type { EventWebResponse } from '@volontariapp/contracts';
import { EventDTO } from '../common/event.dto.js';

export class UpdateEventResponseDTO
  implements UpdateEventResponse, EventWebResponse
{
  @ApiProperty({ type: EventDTO, required: true })
  event!: EventDTO;
}
