import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { EventAttendee } from '@volontariapp/contracts';
import { GrpcDateMapper } from '@volontariapp/contracts-nest';

export class EventAttendeeDTO implements Omit<EventAttendee, 'registeredAt' | 'checkedInAt'> {
  static from(attendee: EventAttendee): EventAttendeeDTO {
    const dto = new EventAttendeeDTO();
    dto.userId = attendee.userId;
    dto.registeredAt = GrpcDateMapper.toDate(attendee.registeredAt);
    dto.checkedInAt = GrpcDateMapper.toDate(attendee.checkedInAt);
    return dto;
  }

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId!: string;

  @ApiPropertyOptional({ example: '2026-06-01T10:00:00.000Z', type: Date })
  registeredAt!: Date | undefined;

  @ApiPropertyOptional({ example: '2026-06-01T14:15:00.000Z', type: Date })
  checkedInAt?: Date | undefined;
}
