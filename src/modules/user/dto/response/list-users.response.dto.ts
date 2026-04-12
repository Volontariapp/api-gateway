import { ApiProperty } from '@nestjs/swagger';
import { ListUsersResponse } from '@volontariapp/contracts-nest';
import { ListUsersWebResponse } from '@volontariapp/contracts';
import { PaginationResponseDTO } from '../../../../common/dto/response/index.js';
import { UserDTO } from '../common/user.dto.js';

export class ListUsersResponseDTO
  implements ListUsersResponse, ListUsersWebResponse
{
  @ApiProperty({ type: [UserDTO] })
  users!: UserDTO[];

  @ApiProperty({ example: 100 })
  totalCount!: number;

  @ApiProperty({ type: PaginationResponseDTO })
  pagination!: PaginationResponseDTO;
}
