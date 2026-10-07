import { ApiProperty } from '@nestjs/swagger';
import { CreateBadgeRequest } from '@volontariapp/contracts';
import { CreateBadgeCommand } from '@volontariapp/contracts-nest';

export class CreateBadgeRequestDTO implements CreateBadgeRequest {
  @ApiProperty({ example: 'Volunteer' })
  name!: string;

  @ApiProperty({ example: 'volunteer' })
  slug!: string;

  @ApiProperty({ example: 'Awarded for volunteering at events' })
  description!: string;

  @ApiProperty({ required: false, example: '/badges/volunteer.png' })
  iconPath?: string;

  @ApiProperty({ required: false, example: '76c5b964-b5a1-43e3-85e2-040683457e56' })
  iconFileId?: string;

  @ApiProperty({ example: '5d0e4a3c-7f0b-4b76-9a52-0d1f4f3b9e11' })
  idempotencyKey!: string;

  toCommand(): CreateBadgeCommand {
    return {
      name: this.name,
      slug: this.slug,
      description: this.description,
      iconPath: this.iconPath,
      iconFileId: this.iconFileId,
      idempotencyKey: this.idempotencyKey,
    };
  }
}
