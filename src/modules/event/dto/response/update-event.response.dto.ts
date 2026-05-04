import { ApiProperty } from '@nestjs/swagger';
import type { EventWebResponse } from '@volontariapp/contracts';
import type { UpdateEventResponse } from '@volontariapp/contracts-nest';
import { EventDTO } from '../common/event.dto.js';

export class UpdateEventResponseDTO implements EventWebResponse {
  static fromResponse(response: UpdateEventResponse): UpdateEventResponseDTO {
    const dto = new UpdateEventResponseDTO();
    if (response.event) {
      dto.event = EventDTO.fromResponse(response.event);
    }
    return dto;
  }

  @ApiProperty({ type: EventDTO, required: true })
  event!: EventDTO;
}
