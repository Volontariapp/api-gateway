import { ApiProperty } from '@nestjs/swagger';
import { Badge } from '@volontariapp/contracts-nest';
import { BadgeDTO } from '../common/badge.dto.js';

export class ListBadgesResponseDTO {
  static fromResponse(res: { badges: Badge[] }): ListBadgesResponseDTO {
    const dto = new ListBadgesResponseDTO();
    dto.badges = res.badges.map((b) => BadgeDTO.fromBadge(b));
    return dto;
  }

  @ApiProperty({ type: [BadgeDTO] })
  badges!: BadgeDTO[];
}
