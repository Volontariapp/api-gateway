import { ApiProperty } from '@nestjs/swagger';
import { ListBadgesRequest } from '@volontariapp/contracts';
import { ListBadgesQuery } from '@volontariapp/contracts-nest';
import { PaginationRequestDTO } from '../../../../common/dto/index.js';

export class ListBadgesRequestDTO implements ListBadgesRequest {
  @ApiProperty({ type: PaginationRequestDTO, required: false })
  pagination?: PaginationRequestDTO;

  toQuery(): ListBadgesQuery {
    return {
      pagination: this.pagination
        ? { limit: this.pagination.limit, page: this.pagination.page }
        : undefined,
    };
  }
}
