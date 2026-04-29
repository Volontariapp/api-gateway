import { ApiProperty } from '@nestjs/swagger';
import { PaginationRequestDTO } from '../../../../common/dto/index.js';
import { ListBadgesQuery } from '@volontariapp/contracts-nest';

export class ListBadgesRequestDTO {
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
