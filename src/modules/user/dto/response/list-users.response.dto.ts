import { ApiProperty } from '@nestjs/swagger';
import { ListUsersWebResponse } from '@volontariapp/contracts';
import {
  ListUsersResponse,
  GetMyFollowsProfilesResponse,
  GetMyFollowersProfilesResponse,
  User,
} from '@volontariapp/contracts-nest';
import { PaginationResponseDTO } from '../../../../common/dto/response/index.js';
import { UserDTO } from '../common/user.dto.js';

export class ListUsersResponseDTO implements ListUsersWebResponse {
  static fromResponse(
    res: ListUsersResponse | GetMyFollowsProfilesResponse | GetMyFollowersProfilesResponse,
  ): ListUsersResponseDTO {
    const dto = new ListUsersResponseDTO();
    dto.users = res.users.map((u: User) => UserDTO.fromUser(u));
    dto.pagination = res.pagination as PaginationResponseDTO;
    return dto;
  }

  @ApiProperty({ type: [UserDTO] })
  users!: UserDTO[];

  @ApiProperty({ type: PaginationResponseDTO })
  pagination!: PaginationResponseDTO;
}
