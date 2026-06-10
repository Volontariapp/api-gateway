import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ListPostsQuery } from '@volontariapp/contracts-nest';
import { ListPostsRequest } from '@volontariapp/contracts';

export class ListPostsRequestDTO implements ListPostsRequest {
  @ApiProperty({ example: 10, required: false })
  @Type(() => Number)
  limit?: number;

  @ApiProperty({ example: 1, required: false })
  @Type(() => Number)
  page?: number;

  @ApiProperty({ example: 'uuid-user-123', required: false })
  @IsOptional()
  @IsString()
  authorId?: string;

  toQuery(): ListPostsQuery {
    return {
      pagination: {
        limit: this.limit ?? 10,
        page: this.page ?? 1,
      },
      authorId: this.authorId,
    };
  }
}
