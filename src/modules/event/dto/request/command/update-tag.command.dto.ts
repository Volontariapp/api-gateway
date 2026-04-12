import { UpdateTagCommand } from '@volontariapp/contracts-nest';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTagCommandDTO implements UpdateTagCommand {
  @ApiProperty({ example: '76c5b964-b5a1-43e3-85e2-040683457e56' })
  id!: string;

  @ApiProperty({ example: 'Tech Updated' })
  name!: string;

  @ApiProperty({ example: '#FF0000' })
  color!: string;

  toCommand(): UpdateTagCommand {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
    };
  }
}
