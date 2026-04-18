import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GetUserLikesQuery } from '@volontariapp/contracts-nest';
import { GetUserLikesWebRequest } from '@volontariapp/contracts';
import { PaginationRequestDTO } from '../../common/pagination.dto.js';

export class GetUserLikesRequestDTO implements GetUserLikesWebRequest {
  @ApiPropertyOptional({ type: PaginationRequestDTO })
  @Type(() => PaginationRequestDTO)
  pagination?: PaginationRequestDTO;

  userId!: string;

  toQuery(): GetUserLikesQuery {
    return {
      userId: this.userId,
      pagination: this.pagination,
    };
  }
}
