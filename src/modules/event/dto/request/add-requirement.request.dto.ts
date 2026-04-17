import { ApiProperty } from '@nestjs/swagger';
import { AddRequirementRequest } from '@volontariapp/contracts';
import { ManageRequirementCommand } from '@volontariapp/contracts-nest';

export class AddRequirementRequestDTO implements AddRequirementRequest {
  eventId!: string;

  @ApiProperty({ example: 'Volunteers' })
  name!: string;

  @ApiProperty({
    example: 'Need people to help setup the room.',
  })
  description!: string;

  @ApiProperty({ example: 10 })
  neededQuantity!: number;

  toCommand(): ManageRequirementCommand {
    return {
      eventId: this.eventId,
      add: {
        name: this.name,
        description: this.description,
        neededQuantity: this.neededQuantity,
      },
    };
  }
}
