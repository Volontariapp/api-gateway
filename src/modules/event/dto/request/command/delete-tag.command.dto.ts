import { DeleteTagCommand } from '@volontariapp/contracts-nest';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteTagCommandDTO implements DeleteTagCommand {
  @ApiProperty({ example: '76c5b964-b5a1-43e3-85e2-040683457e56' })
  id!: string;

  toCommand(): DeleteTagCommand {
    return {
      id: this.id,
    };
  }
}
