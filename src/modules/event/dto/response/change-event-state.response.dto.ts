import { ApiProperty } from '@nestjs/swagger';
import type { ChangeEventStateResponse } from '@volontariapp/contracts-nest';
import type { EventWebResponse } from '@volontariapp/contracts';
import { EventDTO } from '../common/event.dto.js';

export class ChangeEventStateResponseDTO
  implements ChangeEventStateResponse, EventWebResponse
{
  @ApiProperty({ type: EventDTO, required: true })
  event!: EventDTO;
}
