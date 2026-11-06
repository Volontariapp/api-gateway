import { ApiProperty } from '@nestjs/swagger';
import { GrpcDateMapper, type BadgeProgress } from '@volontariapp/contracts-nest';
import { BadgeRequirementProgressDTO } from './badge-requirement-progress.dto.js';

export class BadgeProgressDTO {
  @ApiProperty({ example: 'EVENT_PARTICIPATION_TIER_2' })
  slug!: string;

  @ApiProperty({ example: 'Engage' })
  name!: string;

  @ApiProperty({ example: 'Participer a 5 evenements' })
  description!: string;

  @ApiProperty({ example: 250, description: 'Points credited when the badge is awarded' })
  points!: number;

  @ApiProperty({ example: false })
  unlocked!: boolean;

  @ApiProperty({ required: false, type: Date, description: 'Present only when unlocked' })
  awardedAt?: Date;

  @ApiProperty({
    example: 60,
    minimum: 0,
    maximum: 100,
    description: '100 whenever the badge is unlocked',
  })
  percent!: number;

  @ApiProperty({ type: [BadgeRequirementProgressDTO] })
  requirements!: BadgeRequirementProgressDTO[];

  @ApiProperty({ required: false, description: 'Stored file id of the badge icon' })
  iconFileId?: string;

  static fromProgress(progress: BadgeProgress): BadgeProgressDTO {
    const dto = new BadgeProgressDTO();
    dto.slug = progress.slug;
    dto.name = progress.name;
    dto.description = progress.description;
    dto.points = progress.points;
    dto.unlocked = progress.unlocked;
    dto.awardedAt = GrpcDateMapper.toDate(progress.awardedAt);
    dto.percent = progress.percent;
    dto.requirements = progress.requirements.map((r) =>
      BadgeRequirementProgressDTO.fromRequirement(r),
    );
    dto.iconFileId = progress.iconFileId;
    return dto;
  }
}
