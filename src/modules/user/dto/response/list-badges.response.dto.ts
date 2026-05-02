import { ApiProperty } from '@nestjs/swagger';
import { ListBadgesWebResponse, PaginationResponse } from '@volontariapp/contracts';
import { Badge } from '@volontariapp/contracts-nest';
import { PaginationResponseDTO } from '../../../../common/dto/response/index.js';
import { BadgeDTO } from '../common/badge.dto.js';

export class ListBadgesResponseDTO implements ListBadgesWebResponse {
  static fromResponse(res: {
    badges: Badge[];
    pagination: PaginationResponse | undefined;
  }): ListBadgesResponseDTO {
    const dto = new ListBadgesResponseDTO();
    dto.badges = res.badges.map((b) => BadgeDTO.fromBadge(b));
    dto.pagination = res.pagination as PaginationResponseDTO;
    return dto;
  }

  @ApiProperty({ type: [BadgeDTO] })
  badges!: BadgeDTO[];

  @ApiProperty({ type: PaginationResponseDTO })
  pagination!: PaginationResponseDTO;
}
