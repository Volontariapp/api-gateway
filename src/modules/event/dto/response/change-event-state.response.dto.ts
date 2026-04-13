import { ApiProperty } from '@nestjs/swagger';
import type { EventWebResponse } from '@volontariapp/contracts';
import { EventDTO } from '../common/event.dto.js';

export class ChangeEventStateResponseDTO implements EventWebResponse {
  @ApiProperty({ type: EventDTO, required: true })
  event!: EventDTO;
}
