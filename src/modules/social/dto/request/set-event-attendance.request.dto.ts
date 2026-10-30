import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsUUID } from 'class-validator';
import { SetEventAttendanceCommand } from '@volontariapp/contracts';

export class SetEventAttendanceRequestDTO implements Omit<SetEventAttendanceCommand, 'eventId'> {
  @ApiProperty({
    description: 'List of user IDs who attended the event',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  checkedUserIds!: string[];

  @ApiPropertyOptional({
    description: 'List of user IDs who did not attend the event',
    example: [],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  uncheckedUserIds: string[] = [];

  eventId!: string;

  toCommand(): SetEventAttendanceCommand {
    return {
      eventId: this.eventId,
      checkedUserIds: this.checkedUserIds,
      uncheckedUserIds: this.uncheckedUserIds,
    };
  }
}
