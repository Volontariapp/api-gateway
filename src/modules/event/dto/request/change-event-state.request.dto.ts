import { ApiProperty } from '@nestjs/swagger';
import {
  ChangeEventStateCommand,
  EventState,
} from '@volontariapp/contracts-nest';

export class ChangeEventStateRequestDTO implements ChangeEventStateCommand {
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
