import { ApiProperty } from '@nestjs/swagger';
import { ListUsersQuery } from '@volontariapp/contracts-nest';
import { ListUsersRequest } from '@volontariapp/contracts';
import { PaginationRequestDTO } from '../../../../common/dto/request/index.js';

export class ListUsersRequestDTO implements ListUsersRequest {
  @ApiProperty({ type: PaginationRequestDTO })
  pagination!: PaginationRequestDTO;

  toQuery(): ListUsersQuery {
    return {
      pagination: {
        limit: this.pagination.limit,
        page: this.pagination.page,
      },
    };
  }
}
