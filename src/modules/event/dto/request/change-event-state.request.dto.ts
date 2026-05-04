import { ApiProperty } from '@nestjs/swagger';
import { ChangeEventStateCommand } from '@volontariapp/contracts-nest';
import { ChangeEventStateRequest, EventState } from '@volontariapp/contracts';

export class ChangeEventStateRequestDTO implements ChangeEventStateRequest {
  @ApiProperty({ example: 'uuid-event-123' })
  id!: string;

  @ApiProperty({ enum: EventState, example: EventState.EVENT_STATE_PUBLISHED })
  newState!: EventState;

  toCommand(): ChangeEventStateCommand {
    return {
      id: this.id,
      newState: this.newState as unknown as number,
    };
  }
}
