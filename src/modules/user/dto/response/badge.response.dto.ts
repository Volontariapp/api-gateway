import { ApiProperty } from '@nestjs/swagger';
import { Badge } from '@volontariapp/contracts-nest';
import { BadgeDTO } from '../common/badge.dto.js';

export class BadgeResponseDTO {
  static fromResponse(res: { badge: Badge | undefined }): BadgeResponseDTO {
    const dto = new BadgeResponseDTO();
    if (res.badge) {
      dto.badge = BadgeDTO.fromBadge(res.badge);
    }
    return dto;
  }

  @ApiProperty({ type: BadgeDTO })
  badge!: BadgeDTO;
}
