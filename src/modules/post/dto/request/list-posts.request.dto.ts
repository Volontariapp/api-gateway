import { ApiProperty } from '@nestjs/swagger';
import { ListPostsQuery } from '@volontariapp/contracts-nest';
import { ListPostsRequest } from '@volontariapp/contracts';

export class ListPostsRequestDTO implements ListPostsRequest {
  @ApiProperty({ example: 10, required: false })
  limit?: number;

  @ApiProperty({ example: 0, required: false })
  page?: number;

  @ApiProperty({ example: 'uuid-user-123', required: false })
  authorId?: string;

  toQuery(): ListPostsQuery {
    return {
      pagination: {
        limit: this.limit ?? 10,
        page: this.page ?? 0,
      },
      authorId: this.authorId,
    };
  }
}
