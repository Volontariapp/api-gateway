import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GetEventAttendeesResponse } from '@volontariapp/contracts';
import { PaginationResponseDTO } from '../common/pagination-response.dto.js';
import { EventAttendeeDTO } from '../common/event-attendee.dto.js';

export class GetEventAttendeesResponseDTO implements GetEventAttendeesResponse {
  @ApiProperty({ type: [EventAttendeeDTO] })
  attendees!: EventAttendeeDTO[];

  @ApiPropertyOptional({ type: PaginationResponseDTO })
  pagination!: PaginationResponseDTO | undefined;
}
