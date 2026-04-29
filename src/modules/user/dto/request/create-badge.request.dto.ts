import { ApiProperty } from '@nestjs/swagger';
import { CreateBadgeCommand } from '@volontariapp/contracts-nest';

export class CreateBadgeRequestDTO {
  @ApiProperty({ example: 'Volunteer' })
  name!: string;

  @ApiProperty({ example: 'volunteer' })
  slug!: string;

  @ApiProperty({ example: 'Awarded for volunteering at events' })
  description!: string;

  @ApiProperty({ required: false, example: '/badges/volunteer.png' })
  iconPath?: string;

  toCommand(): CreateBadgeCommand {
    return {
      name: this.name,
      slug: this.slug,
      description: this.description,
      iconPath: this.iconPath,
    };
  }
}
