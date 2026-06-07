import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { ListPostsQuery } from '@volontariapp/contracts-nest';
import { ListPostsRequest } from '@volontariapp/contracts';

export class ListPostsRequestDTO implements ListPostsRequest {
  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({ example: 'uuid-user-123', required: false })
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
