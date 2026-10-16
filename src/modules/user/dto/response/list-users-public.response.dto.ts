import { ApiProperty } from '@nestjs/swagger';
import {
  GetEventParticipantsProfilesResponse,
  GetPostLikersProfilesResponse,
  UserPublic,
} from '@volontariapp/contracts-nest';
import {
  GetEventParticipantsProfilesWebResponse,
  GetPostLikersProfilesWebResponse,
} from '@volontariapp/contracts';
import { PaginationResponseDTO } from '../../../../common/dto/response/index.js';
import { UserPublicDTO } from '../common/user.dto.js';
import type { UserAvatarUrlBuilder } from '../common/user-avatar-url.builder.js';

export class ListUsersPublicResponseDTO
  implements GetEventParticipantsProfilesWebResponse, GetPostLikersProfilesWebResponse
{
  static fromResponse(
    res: GetEventParticipantsProfilesResponse | GetPostLikersProfilesResponse,
    avatarUrls: UserAvatarUrlBuilder,
  ): ListUsersPublicResponseDTO {
    const dto = new ListUsersPublicResponseDTO();
    dto.users = res.users.map((u: UserPublic) => UserPublicDTO.fromUserPublic(u, avatarUrls));
    dto.pagination = res.pagination as PaginationResponseDTO;
    return dto;
  }

  @ApiProperty({ type: [UserPublicDTO] })
  users!: UserPublicDTO[];

  @ApiProperty({ type: PaginationResponseDTO })
  pagination!: PaginationResponseDTO;
}
