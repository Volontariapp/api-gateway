import { ApiProperty } from '@nestjs/swagger';
import { UpdateTagCommand } from '@volontariapp/contracts-nest';
import { UpdateTagRequest } from '@volontariapp/contracts';
import { TagsNames } from '@volontariapp/shared';

export class UpdateTagRequestDTO implements UpdateTagRequest {
  id!: string;

  @ApiProperty({ example: 'Tech' })
  name!: string;

  @ApiProperty({ example: TagsNames.ECOLOGIE })
  balise!: string;

  toCommand(): UpdateTagCommand {
    return {
      id: this.id,
      name: this.name,
      balise: this.balise,
    };
  }
}
