import { ApiProperty } from '@nestjs/swagger';
import type { ListPostsResponse } from '@volontariapp/contracts-nest';
import { ListPostsWebResponse } from '@volontariapp/contracts';
import { PaginationResponseDTO } from '../../../../common/dto/response/index.js';

import { PostDTO } from '../common/post.dto.js';

export class ListPostsResponseDTO implements ListPostsResponse, ListPostsWebResponse {
  static fromResponse(response: ListPostsResponse): ListPostsResponseDTO {
    const dto = new ListPostsResponseDTO();
    dto.posts = response.posts as PostDTO[];
    dto.totalCount = response.posts.length;
    dto.pagination = response.pagination as PaginationResponseDTO;
    return dto;
  }

  @ApiProperty({ type: [PostDTO] })
  posts!: PostDTO[];

  @ApiProperty({ example: 100 })
  totalCount!: number;

  @ApiProperty({ type: PaginationResponseDTO })
  pagination!: PaginationResponseDTO;
}
