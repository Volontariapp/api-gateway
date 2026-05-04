import { ApiProperty } from '@nestjs/swagger';
import type { EventWebResponse } from '@volontariapp/contracts';
import type { CreateEventResponse } from '@volontariapp/contracts-nest';
import { EventDTO } from '../common/event.dto.js';

export class CreateEventResponseDTO implements EventWebResponse {
  static fromResponse(response: CreateEventResponse): CreateEventResponseDTO {
    const dto = new CreateEventResponseDTO();
    if (response.event) {
      dto.event = EventDTO.fromResponse(response.event);
    }
    return dto;
  }

  @ApiProperty({ type: EventDTO, required: true })
  event!: EventDTO;
}
