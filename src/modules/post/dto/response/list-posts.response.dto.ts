import { ApiProperty } from '@nestjs/swagger';
import type { ListPostsResponse } from '@volontariapp/contracts-nest';
import { ListPostsWebResponse } from '@volontariapp/contracts';
import { PaginationResponseDTO } from '../../../../common/dto/response/index.js';

import { PostDTO } from '../common/post.dto.js';
import type { PostMediaUrlBuilder } from '../common/post-media-url.builder.js';
import type { PostOnWire } from '../common/post-media.dto.js';

import { EventDTO } from '../../../event/dto/common/event.dto.js';

export class ListPostsResponseDTO implements ListPostsWebResponse {
  static fromResponse(
    response: Omit<ListPostsResponse, 'posts'> & { posts: PostOnWire[] },
    urls: PostMediaUrlBuilder,
    eventsMap?: Map<string, EventDTO>,
  ): ListPostsResponseDTO {
    const dto = new ListPostsResponseDTO();
    dto.posts = response.posts.map((post) =>
      PostDTO.fromPost(post, urls, post.eventId ? eventsMap?.get(post.eventId) : undefined),
    );
    dto.totalCount = response.pagination?.total ?? response.posts.length;
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
