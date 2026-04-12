import { ApiProperty } from '@nestjs/swagger';
import { ListPostsResponse } from '@volontariapp/contracts-nest';
import { ListPostsWebResponse } from '@volontariapp/contracts';
import { PaginationResponseDTO } from '../../../../common/dto/response/index.js';

import { PostDTO } from '../common/post.dto.js';

export class ListPostsResponseDTO
  implements ListPostsResponse, ListPostsWebResponse
{
  @ApiProperty({ type: [PostDTO] })
  posts!: PostDTO[];

  @ApiProperty({ example: 100 })
  totalCount!: number;

  @ApiProperty({ type: PaginationResponseDTO })
  pagination!: PaginationResponseDTO;
}
