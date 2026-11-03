import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ListPostsQuery } from '@volontariapp/contracts-nest';
import { ListPostsRequest } from '@volontariapp/contracts';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  PaginationLimit,
  PaginationPage,
} from '../../../../common/pagination/index.js';

export class ListPostsRequestDTO implements ListPostsRequest {
  @PaginationLimit()
  limit?: number;

  @PaginationPage()
  page?: number;

  @ApiProperty({ example: 'uuid-user-123', required: false })
  @IsOptional()
  @IsString()
  authorId?: string;

  toQuery(): ListPostsQuery {
    return {
      pagination: {
        limit: this.limit ?? DEFAULT_LIMIT,
        page: this.page ?? DEFAULT_PAGE,
      },
      authorId: this.authorId,
    };
  }
}
