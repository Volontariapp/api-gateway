import { ApiProperty } from '@nestjs/swagger';
import { CreateTagCommand } from '@volontariapp/contracts-nest';
import { CreateTagRequest } from '@volontariapp/contracts';

export class CreateTagRequestDTO implements CreateTagRequest {
  @ApiProperty({ example: 'tech' })
  slug!: string;

  @ApiProperty({ example: 'Technology' })
  name!: string;

  @ApiProperty({ example: '#FF0000' })
  color!: string;

  toCommand(): CreateTagCommand {
    return {
      slug: this.slug,
      name: this.name,
      color: this.color,
    };
  }
}
