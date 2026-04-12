import { CreateTagCommand } from '@volontariapp/contracts-nest';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTagCommandDTO implements CreateTagCommand {
  @ApiProperty({ example: 'tech' })
  slug!: string;

  @ApiProperty({ example: 'Tech' })
  name!: string;

  @ApiProperty({ example: '#000000' })
  color!: string;

  toCommand(): CreateTagCommand {
    return {
      slug: this.slug,
      name: this.name,
      color: this.color,
    };
  }
}
