import { ApiProperty } from '@nestjs/swagger';
import { ListUsersResponse } from '@volontariapp/contracts-nest';
import { PaginationResponseDTO } from '../../../../common/dto/response/index.js';
import { UserDTO } from '../common/user.dto.js';

export class ListUsersResponseDTO {
  static fromResponse(res: ListUsersResponse): ListUsersResponseDTO {
    const dto = new ListUsersResponseDTO();
    dto.users = res.users.map((u) => UserDTO.fromUser(u));
    dto.pagination = res.pagination as PaginationResponseDTO;
    return dto;
  }

  @ApiProperty({ type: [UserDTO] })
  users!: UserDTO[];

  @ApiProperty({ type: PaginationResponseDTO })
  pagination!: PaginationResponseDTO;
}
