import { ApiProperty } from '@nestjs/swagger';
import { ManageRequirementCommand } from '@volontariapp/contracts-nest';
import { ManageRequirementRequest } from '@volontariapp/contracts';

export class ManageRequirementRequestDTO implements ManageRequirementRequest {
  eventId!: string;

  @ApiProperty({ example: 'ADD', enum: ['ADD', 'REMOVE'] })
  type!: 'ADD' | 'REMOVE';

  @ApiProperty({
    example: '76c5b964-b5a1-43e3-85e2-040683457e56',
    required: false,
  })
  requirementId?: string;

  @ApiProperty({ example: 'Volunteers', required: false })
  name?: string;

  @ApiProperty({
    example: 'Need people to help setup the room.',
    required: false,
  })
  description?: string;

  @ApiProperty({ example: 10, required: false })
  neededQuantity?: number;

  toCommand(): ManageRequirementCommand {
    if (this.type === 'ADD') {
      return {
        eventId: this.eventId,
        add: {
          name: this.name ?? '',
          description: this.description ?? '',
          neededQuantity: this.neededQuantity ?? 0,
        },
      };
    }

    return {
      eventId: this.eventId,
      remove: {
        requirementId: this.requirementId ?? '',
      },
    };
  }
}
