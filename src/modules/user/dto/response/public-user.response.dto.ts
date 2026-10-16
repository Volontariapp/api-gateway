import { ApiProperty } from '@nestjs/swagger';
import { PublicUserResponse, PublicUserWebResponse } from '@volontariapp/contracts';
import { UserPublicDTO } from '../common/user.dto.js';
import type { UserAvatarUrlBuilder } from '../common/user-avatar-url.builder.js';

export class PublicUserResponseDTO implements PublicUserWebResponse {
  static fromResponse(
    res: PublicUserResponse,
    avatarUrls: UserAvatarUrlBuilder,
  ): PublicUserResponseDTO {
    const dto = new PublicUserResponseDTO();
    if (res.userPublic) {
      dto.user = UserPublicDTO.fromUserPublic(res.userPublic, avatarUrls);
    }
    return dto;
  }

  @ApiProperty({ type: UserPublicDTO })
  user!: UserPublicDTO;
}
