import { ApiProperty } from '@nestjs/swagger';
import { GetEventResponse } from '@volontariapp/contracts-nest';
import { EventWebResponse } from '@volontariapp/contracts';
import { EventDTO } from '../common/event.dto.js';
import type { EventCoverUrlBuilder } from '../common/event-cover-url.builder.js';

export class GetEventResponseDTO implements EventWebResponse {
  static fromResponse(response: GetEventResponse, urls: EventCoverUrlBuilder): GetEventResponseDTO {
    const dto = new GetEventResponseDTO();
    if (response.event) {
      dto.event = EventDTO.fromResponse(response.event, urls);
    }
    return dto;
  }

  @ApiProperty({ type: EventDTO, required: true })
  event!: EventDTO;
}
