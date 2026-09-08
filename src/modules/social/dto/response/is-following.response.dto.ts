import { ApiProperty } from '@nestjs/swagger';
import type { GetIsFollowingResponse } from '@volontariapp/contracts-nest';

export class IsFollowingResponseDTO implements GetIsFollowingResponse {
  @ApiProperty({
    description: 'Whether the user is following the target user',
    example: true,
  })
  isFollowing!: boolean;

  static fromResponse(res: GetIsFollowingResponse): IsFollowingResponseDTO {
    const dto = new IsFollowingResponseDTO();
    dto.isFollowing = res.isFollowing;
    return dto;
  }
}
