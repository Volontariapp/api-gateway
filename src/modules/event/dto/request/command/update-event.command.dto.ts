import { ApiProperty } from '@nestjs/swagger';
import { UpdateEventCommand } from '@volontariapp/contracts-nest';
import { EventDTO } from '../../common/event.dto.js';

export class UpdateEventCommandDTO implements UpdateEventCommand {
  @ApiProperty({ example: '76c5b964-b5a1-43e3-85e2-040683457e56' })
  id!: string;

  @ApiProperty({ type: EventDTO, required: false })
  event: EventDTO | undefined;

  @ApiProperty({ example: ['title', 'description'], isArray: true })
  updateMask!: string[];

  toCommand(): UpdateEventCommand {
    return {
      id: this.id,
      event: this.event,
      updateMask: this.updateMask,
    };
  }
}
