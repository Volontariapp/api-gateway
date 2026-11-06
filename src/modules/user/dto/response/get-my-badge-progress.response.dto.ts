import { ApiProperty } from '@nestjs/swagger';
import type { GetMyBadgeProgressWebResponse } from '@volontariapp/contracts';
import type { GetMyBadgeProgressResponse } from '@volontariapp/contracts-nest';
import { BadgeProgressDTO } from '../common/badge-progress.dto.js';

export class GetMyBadgeProgressResponseDTO implements GetMyBadgeProgressWebResponse {
  static fromResponse(res: GetMyBadgeProgressResponse): GetMyBadgeProgressResponseDTO {
    const dto = new GetMyBadgeProgressResponseDTO();
    dto.badges = res.badges.map((b) => BadgeProgressDTO.fromProgress(b));
    return dto;
  }

  @ApiProperty({ type: [BadgeProgressDTO] })
  badges!: BadgeProgressDTO[];
}
