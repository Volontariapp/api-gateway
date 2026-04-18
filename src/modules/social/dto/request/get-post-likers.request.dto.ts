import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GetPostLikersQuery } from '@volontariapp/contracts-nest';
import { GetPostLikersWebRequest } from '@volontariapp/contracts';
import { PaginationRequestDTO } from '../../common/pagination.dto.js';

export class GetPostLikersRequestDTO implements GetPostLikersWebRequest {
  @ApiPropertyOptional({ type: PaginationRequestDTO })
  @Type(() => PaginationRequestDTO)
  pagination?: PaginationRequestDTO;

  postId!: string;

  toQuery(): GetPostLikersQuery {
    return {
      postId: this.postId,
      pagination: this.pagination,
    };
  }
}
