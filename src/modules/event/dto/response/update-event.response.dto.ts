import { ApiProperty } from '@nestjs/swagger';
import type { EventWebResponse } from '@volontariapp/contracts';
import type { UpdateEventResponse } from '@volontariapp/contracts-nest';
import { EventDTO } from '../common/event.dto.js';
import type { EventCoverUrlBuilder } from '../common/event-cover-url.builder.js';

export class UpdateEventResponseDTO implements EventWebResponse {
  static fromResponse(
    response: UpdateEventResponse,
    urls: EventCoverUrlBuilder,
  ): UpdateEventResponseDTO {
    const dto = new UpdateEventResponseDTO();
    if (response.event) {
      dto.event = EventDTO.fromResponse(response.event, urls);
    }
    return dto;
  }

  @ApiProperty({ type: EventDTO, required: true })
  event!: EventDTO;
}
