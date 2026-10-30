import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { GetEventAttendeesResponse } from '@volontariapp/contracts';
import { PaginationResponseDTO } from '../common/pagination-response.dto.js';
import { EventAttendeeDTO } from '../common/event-attendee.dto.js';

/**
 * No Web variant exists in contracts: attendees carry Timestamp on the wire but
 * Date (ISO string) at the edge, so only the Timestamp-free part is implemented.
 */
export class GetEventAttendeesResponseDTO implements Omit<GetEventAttendeesResponse, 'attendees'> {
  static from(res: GetEventAttendeesResponse): GetEventAttendeesResponseDTO {
    const dto = new GetEventAttendeesResponseDTO();
    dto.attendees = res.attendees.map((a) => EventAttendeeDTO.from(a));
    dto.pagination = res.pagination;
    return dto;
  }

  @ApiProperty({ type: [EventAttendeeDTO] })
  attendees!: EventAttendeeDTO[];

  @ApiPropertyOptional({ type: PaginationResponseDTO })
  pagination!: PaginationResponseDTO | undefined;
}
