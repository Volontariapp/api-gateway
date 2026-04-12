import { ApiProperty } from '@nestjs/swagger';
import { ManageRequirementCommand } from '@volontariapp/contracts-nest';

export class ManageRequirementCommandDTO {
  @ApiProperty({ example: '76c5b964-b5a1-43e3-85e2-040683457e56' })
  eventId!: string;

  @ApiProperty({
    example: '76c5b964-b5a1-43e3-85e2-040683457e56',
    required: false,
  })
  requirementId!: string;

  @ApiProperty({ example: 'Volunteers', required: false })
  name!: string;

  @ApiProperty({
    example: 'Need people to help setup the room.',
    required: false,
  })
  description!: string;

  @ApiProperty({ example: 10 })
  neededQuantity!: number;

  @ApiProperty({ example: 'delete-requirement', required: false })
  action!: string;

  toCommand(): ManageRequirementCommand {
    return {
      eventId: this.eventId,
      add:
        this.action !== 'delete-requirement'
          ? {
              name: this.name,
              description: this.description,
              neededQuantity: this.neededQuantity,
            }
          : undefined,
      remove:
        this.action === 'delete-requirement'
          ? {
              requirementId: this.requirementId,
            }
          : undefined,
    };
  }
}
