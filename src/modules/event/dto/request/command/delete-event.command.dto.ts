import { DeleteEventCommand } from '@volontariapp/contracts-nest';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteEventCommandDTO implements DeleteEventCommand {
  @ApiProperty({ example: '76c5b964-b5a1-43e3-85e2-040683457e56' })
  id!: string;

  toCommand(): DeleteEventCommand {
    return {
      id: this.id,
    };
  }
}
