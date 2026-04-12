import { ApiProperty } from '@nestjs/swagger';
import { GetEventResponse } from '@volontariapp/contracts-nest';
import { EventWebResponse } from '@volontariapp/contracts';
import { EventDTO } from '../common/event.dto.js';

export class GetEventResponseDTO implements GetEventResponse, EventWebResponse {
  @ApiProperty({ type: EventDTO, required: true })
  event!: EventDTO;
}
