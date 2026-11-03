import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GetMyFollowsWebResponse } from '@volontariapp/contracts';
import { PaginationResponseDTO } from '../../../../common/dto/response/index.js';

export class IdsListResponseDTO implements GetMyFollowsWebResponse {
  @ApiProperty({ type: [String] })
  ids: string[] = [];

  @ApiPropertyOptional({ type: PaginationResponseDTO })
  pagination: PaginationResponseDTO | undefined;
}
