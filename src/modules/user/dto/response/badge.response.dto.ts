import { ApiProperty } from '@nestjs/swagger';
import { BadgeWebResponse } from '@volontariapp/contracts';
import { Badge } from '@volontariapp/contracts-nest';
import { BadgeDTO } from '../common/badge.dto.js';

export class BadgeResponseDTO implements BadgeWebResponse {
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
