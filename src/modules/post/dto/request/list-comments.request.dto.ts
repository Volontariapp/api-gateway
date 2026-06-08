import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

import { ListCommentsQuery } from '@volontariapp/contracts-nest';
import type { ListCommentsRequest } from '@volontariapp/contracts';

export class ListCommentsRequestDTO implements ListCommentsRequest {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @Transform(({ value }) => parseInt(value as string, 10))
  page: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @Transform(({ value }) => parseInt(value as string, 10))
  limit: number = 10;

  postId!: string;

  toQuery(): ListCommentsQuery {
    return {
      postId: this.postId,
      pagination: {
        page: this.page,
        limit: this.limit,
      },
    };
  }
}
