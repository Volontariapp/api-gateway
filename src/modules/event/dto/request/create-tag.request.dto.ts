import { ApiProperty } from '@nestjs/swagger';
import { CreateTagCommand } from '@volontariapp/contracts-nest';
import { CreateTagRequest } from '@volontariapp/contracts';
import { TagsNames } from '@volontariapp/shared';

export class CreateTagRequestDTO implements CreateTagRequest {
  @ApiProperty({ example: 'tech' })
  slug!: string;

  @ApiProperty({ example: 'Technology' })
  name!: string;

  @ApiProperty({ example: TagsNames.ECOLOGIE })
  balise!: string;

  toCommand(): CreateTagCommand {
    return {
      slug: this.slug,
      name: this.name,
      balise: this.balise,
    };
  }
}
