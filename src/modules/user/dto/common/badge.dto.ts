import { ApiProperty } from '@nestjs/swagger';
import { Badge, GrpcDateMapper } from '@volontariapp/contracts-nest';

export class BadgeDTO {
  @ApiProperty({ example: 'uuid-badge-123' })
  id!: string;

  @ApiProperty({ example: 'Volunteer' })
  name!: string;

  @ApiProperty({ example: 'volunteer' })
  slug!: string;

  @ApiProperty({ required: false, example: '/badges/volunteer.png' })
  iconPath?: string;

  @ApiProperty({ example: 'Awarded for volunteering' })
  description!: string;

  @ApiProperty({ required: false, type: Date })
  awardedAt?: Date;

  @ApiProperty({
    example: 100,
    description: 'Points credited to the user when the badge is awarded',
  })
  points!: number;

  static fromBadge(badge: Badge): BadgeDTO {
    const dto = new BadgeDTO();
    dto.id = badge.id;
    dto.name = badge.name;
    dto.slug = badge.slug;
    dto.iconPath = badge.iconPath;
    dto.description = badge.description;
    dto.awardedAt = GrpcDateMapper.toDate(badge.awardedAt);
    dto.points = badge.points;
    return dto;
  }
}
