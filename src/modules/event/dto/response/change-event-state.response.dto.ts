import { ApiProperty } from '@nestjs/swagger';
import type { EventWebResponse } from '@volontariapp/contracts';
import type { ChangeEventStateResponse } from '@volontariapp/contracts-nest';
import { EventDTO } from '../common/event.dto.js';

export class ChangeEventStateResponseDTO implements EventWebResponse {
  static fromResponse(response: ChangeEventStateResponse): ChangeEventStateResponseDTO {
    const dto = new ChangeEventStateResponseDTO();
    dto.event = response.event ? EventDTO.fromResponse(response.event) : undefined;
    return dto;
  }

  @ApiProperty({ type: EventDTO, required: true })
  event!: EventDTO;
}
