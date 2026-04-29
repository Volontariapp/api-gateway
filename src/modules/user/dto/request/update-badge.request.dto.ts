import { ApiProperty } from '@nestjs/swagger';
import { UpdateBadgeCommand } from '@volontariapp/contracts-nest';

export class UpdateBadgeRequestDTO {
  @ApiProperty({ required: false, example: 'Super Volunteer' })
  name?: string;

  @ApiProperty({ required: false, example: 'super-volunteer' })
  slug?: string;

  @ApiProperty({
    required: false,
    example: 'Awarded for exceptional volunteering',
  })
  description?: string;

  @ApiProperty({ required: false, example: '/badges/super-volunteer.png' })
  iconPath?: string;

  toCommand(badgeId: string): UpdateBadgeCommand {
    return {
      badgeId,
      name: this.name,
      slug: this.slug,
      description: this.description,
      iconPath: this.iconPath,
    };
  }
}
