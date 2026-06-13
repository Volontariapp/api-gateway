import { ApiProperty } from '@nestjs/swagger';
import type { ListPostsResponse } from '@volontariapp/contracts-nest';
import { ListPostsWebResponse } from '@volontariapp/contracts';
import { PaginationResponseDTO } from '../../../../common/dto/response/index.js';

import { PostDTO } from '../common/post.dto.js';

import { timestampToDate } from './comment.response.dto.js';

import { EventDTO } from '../../../event/dto/common/event.dto.js';

export class ListPostsResponseDTO implements ListPostsWebResponse {
  static fromResponse(
    response: ListPostsResponse,
    eventsMap?: Map<string, EventDTO>,
  ): ListPostsResponseDTO {
    const dto = new ListPostsResponseDTO();
    dto.posts = response.posts.map((post) => {
      const postDto = new PostDTO();
      postDto.id = post.id;
      postDto.title = post.title;
      postDto.content = post.content;
      postDto.authorId = post.authorId;
      postDto.createdAt = timestampToDate(post.createdAt);
      postDto.updatedAt = timestampToDate(post.updatedAt);

      if (post.eventId && eventsMap?.has(post.eventId)) {
        postDto.event = eventsMap.get(post.eventId);
      }

      return postDto;
    });
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
