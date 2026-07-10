import { ApiProperty } from '@nestjs/swagger';
import { PublicUserResponse, PublicUserWebResponse } from '@volontariapp/contracts';
import { UserPublicDTO } from '../common/user.dto.js';

export class PublicUserResponseDTO implements PublicUserWebResponse {
  static fromResponse(res: PublicUserResponse): PublicUserResponseDTO {
    const dto = new PublicUserResponseDTO();
    if (res.userPublic) {
      dto.user = UserPublicDTO.fromUserPublic(res.userPublic);
    }
    return dto;
  }

  @ApiProperty({ type: UserPublicDTO })
  user!: UserPublicDTO;
}
