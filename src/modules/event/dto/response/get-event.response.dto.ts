import { ApiProperty } from '@nestjs/swagger';
import { GetEventResponse } from '@volontariapp/contracts-nest';
import { EventWebResponse } from '@volontariapp/contracts';
import { EventDTO } from '../common/event.dto.js';

export class GetEventResponseDTO implements EventWebResponse {
  static fromResponse(response: GetEventResponse): GetEventResponseDTO {
    const dto = new GetEventResponseDTO();
    if (response.event) {
      dto.event = EventDTO.fromResponse(response.event);
    }
    return dto;
  }

  @ApiProperty({ type: EventDTO, required: true })
  event!: EventDTO;
}
