import { ApiProperty } from '@nestjs/swagger';
import { ListUsersRequest } from '@volontariapp/contracts';
import { ListUsersQuery } from '@volontariapp/contracts-nest';
import { PaginationRequestDTO } from '../../../../common/dto/request/index.js';
import { Type } from 'class-transformer';

export class ListUsersRequestDTO implements ListUsersRequest {
  @ApiProperty({ type: PaginationRequestDTO, required: false })
  @Type(() => PaginationRequestDTO)
  pagination?: PaginationRequestDTO;

  page?: string | number;
  limit?: string | number;

  toQuery(): ListUsersQuery {
    const pageNum =
      this.pagination?.page ?? (this.page !== undefined ? Number(this.page) : undefined);
    const limitNum =
      this.pagination?.limit ?? (this.limit !== undefined ? Number(this.limit) : undefined);

    return {
      pagination:
        pageNum !== undefined || limitNum !== undefined
          ? { limit: limitNum ?? 50, page: pageNum ?? 1 }
          : undefined,
    };
  }
}
