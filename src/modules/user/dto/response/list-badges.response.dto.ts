import { ApiProperty } from '@nestjs/swagger';
import { ListBadgesWebResponse } from '@volontariapp/contracts';
import { Badge } from '@volontariapp/contracts-nest';
import { PaginationResponseDTO } from '../../../../common/dto/response/index.js';
import { BadgeDTO } from '../common/badge.dto.js';

export class ListBadgesResponseDTO implements ListBadgesWebResponse {
  static fromResponse(res: {
    badges: Badge[];
    pagination?: { total: number; page: number; limit: number; totalPages: number };
  }): ListBadgesResponseDTO {
    const dto = new ListBadgesResponseDTO();
    dto.badges = res.badges.map((b) => BadgeDTO.fromBadge(b));
    if (res.pagination) {
      dto.pagination = {
        total: res.pagination.total,
        page: res.pagination.page,
        limit: res.pagination.limit,
        totalPages: res.pagination.totalPages,
      };
    }
    return dto;
  }

  @ApiProperty({ type: [BadgeDTO] })
  badges!: BadgeDTO[];

  @ApiProperty({ type: PaginationResponseDTO, required: false })
  pagination?: PaginationResponseDTO;
}
