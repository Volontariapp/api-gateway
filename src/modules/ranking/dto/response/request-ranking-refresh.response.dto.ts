import { ApiProperty } from '@nestjs/swagger';
import type { RequestRankingRefreshResponse } from '@volontariapp/contracts-nest';
import type { RequestRankingRefreshWebResponse } from '@volontariapp/contracts';

export class RequestRankingRefreshResponseDTO implements RequestRankingRefreshWebResponse {
  static fromResponse(response: RequestRankingRefreshResponse): RequestRankingRefreshResponseDTO {
    const dto = new RequestRankingRefreshResponseDTO();
    dto.accepted = response.accepted;
    dto.refreshThrottled = response.refreshThrottled;
    return dto;
  }

  @ApiProperty({ example: true, description: 'A recompute was requested' })
  accepted!: boolean;

  @ApiProperty({
    example: false,
    description: 'More than 5 refreshes in a minute: the current list stays, nothing is recomputed',
  })
  refreshThrottled!: boolean;
}
