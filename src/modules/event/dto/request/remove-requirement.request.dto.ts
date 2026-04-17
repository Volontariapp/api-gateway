import { ApiProperty } from '@nestjs/swagger';
import { RemoveRequirementRequest } from '@volontariapp/contracts';
import { ManageRequirementCommand } from '@volontariapp/contracts-nest';

export class RemoveRequirementRequestDTO implements RemoveRequirementRequest {
  eventId!: string;

  @ApiProperty({ example: 'uuid-456' })
  requirementId!: string;

  toCommand(): ManageRequirementCommand {
    return {
      eventId: this.eventId,
      remove: {
        requirementId: this.requirementId,
      },
    };
  }
}
