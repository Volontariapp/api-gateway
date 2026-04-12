import { ApiProperty } from '@nestjs/swagger';
import { ChangeEventStateCommand } from '@volontariapp/contracts-nest';
import { EventState } from '@volontariapp/contracts';

export class ChangeEventStateRequestDTO {
  id!: string;

  @ApiProperty({ enum: EventState, example: EventState.EVENT_STATE_PUBLISHED })
  newState!: EventState;

  toCommand(): ChangeEventStateCommand {
    return {
      id: this.id,
      newState: this.newState,
    };
  }
}
