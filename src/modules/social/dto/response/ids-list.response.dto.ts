import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GetMyFollowsWebResponse } from '@volontariapp/contracts';
import { PaginationResponseDTO } from '../common/pagination-response.dto.js';

export class IdsListResponseDTO implements GetMyFollowsWebResponse {
  @ApiProperty({ example: ['uuid-1', 'uuid-2'], isArray: true })
  ids!: string[];

  @ApiPropertyOptional({ type: PaginationResponseDTO })
  pagination: PaginationResponseDTO | undefined;
}
