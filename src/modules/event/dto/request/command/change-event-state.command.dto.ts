import { ApiProperty } from '@nestjs/swagger';
import {
  ChangeEventStateCommand,
  EventState,
} from '@volontariapp/contracts-nest';

export class ChangeEventStateCommandDTO implements ChangeEventStateCommand {
  @ApiProperty({ example: '76c5b964-b5a1-43e3-85e2-040683457e56' })
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
