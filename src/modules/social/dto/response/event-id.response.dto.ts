import { ApiProperty } from '@nestjs/swagger';
import { GetEventRelatedToPostWebResponse } from '@volontariapp/contracts';

export class EventIdResponseDTO implements GetEventRelatedToPostWebResponse {
  @ApiProperty({ example: 'uuid-event-123' })
  eventId!: string;
}
