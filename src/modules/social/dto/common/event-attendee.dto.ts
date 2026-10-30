import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { EventAttendee } from '@volontariapp/contracts';
import type { Timestamp } from '@volontariapp/contracts-nest';

export class EventAttendeeDTO implements EventAttendee {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId!: string;

  @ApiPropertyOptional({ example: '2026-06-01T10:00:00.000Z' })
  registeredAt!: Timestamp | undefined;

  @ApiPropertyOptional({ example: '2026-06-01T14:15:00.000Z' })
  checkedInAt?: Timestamp | undefined;
}
