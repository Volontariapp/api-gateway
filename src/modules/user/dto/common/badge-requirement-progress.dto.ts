import { ApiProperty } from '@nestjs/swagger';
import type { BadgeRequirementProgress } from '@volontariapp/contracts-nest';

export class BadgeRequirementProgressDTO {
  @ApiProperty({ example: 'EVENTS_FINISHED_TOTAL', description: 'Counter being measured' })
  metric!: string;

  @ApiProperty({ example: 3, description: 'Current value, capped at the target' })
  current!: number;

  @ApiProperty({ example: 5, description: 'Value required to unlock the badge' })
  target!: number;

  static fromRequirement(requirement: BadgeRequirementProgress): BadgeRequirementProgressDTO {
    const dto = new BadgeRequirementProgressDTO();
    dto.metric = requirement.metric;
    dto.current = requirement.current;
    dto.target = requirement.target;
    return dto;
  }
}
