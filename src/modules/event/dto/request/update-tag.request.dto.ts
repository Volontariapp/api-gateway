import { ApiProperty } from '@nestjs/swagger';
import { UpdateTagCommand } from '@volontariapp/contracts-nest';
import { UpdateTagRequest } from '@volontariapp/contracts';

export class UpdateTagRequestDTO implements UpdateTagRequest {
  id!: string;

  @ApiProperty({ example: 'Tech' })
  name!: string;

  @ApiProperty({ example: '#00FF00' })
  color!: string;

  toCommand(): UpdateTagCommand {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
    };
  }
}
