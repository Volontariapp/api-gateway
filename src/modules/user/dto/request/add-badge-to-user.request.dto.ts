import { ApiProperty } from '@nestjs/swagger';

export class AddBadgeToUserRequestDTO {
  @ApiProperty({ example: 'uuid-badge-123' })
  badgeId!: string;
}
