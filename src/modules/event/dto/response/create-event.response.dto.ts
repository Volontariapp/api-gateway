import { ApiProperty } from '@nestjs/swagger';
import type { EventWebResponse } from '@volontariapp/contracts';
import type { CreateEventResponse } from '@volontariapp/contracts-nest';
import { EventDTO } from '../common/event.dto.js';
import type { EventCoverUrlBuilder } from '../common/event-cover-url.builder.js';

export class CreateEventResponseDTO implements EventWebResponse {
  static fromResponse(
    response: CreateEventResponse,
    urls: EventCoverUrlBuilder,
  ): CreateEventResponseDTO {
    const dto = new CreateEventResponseDTO();
    if (response.event) {
      dto.event = EventDTO.fromResponse(response.event, urls);
    }
    return dto;
  }

  @ApiProperty({ type: EventDTO, required: true })
  event!: EventDTO;
}
