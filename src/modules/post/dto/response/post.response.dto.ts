import { ApiProperty } from '@nestjs/swagger';
import type { GetPostResponse } from '@volontariapp/contracts-nest';
import { PostWebResponse } from '@volontariapp/contracts';
import { PostDTO } from '../common/post.dto.js';

import { timestampToDate } from './comment.response.dto.js';

export class PostResponseDTO implements PostWebResponse {
  static fromResponse(response: GetPostResponse): PostResponseDTO {
    const dto = new PostResponseDTO();
    const postDto = new PostDTO();
    if (response.post) {
      postDto.id = response.post.id;
      postDto.title = response.post.title;
      postDto.content = response.post.content;
      postDto.authorId = response.post.authorId;
      postDto.createdAt = timestampToDate(response.post.createdAt);
      postDto.updatedAt = timestampToDate(response.post.updatedAt);
    }
    dto.post = postDto;
    return dto;
  }

  @ApiProperty({ type: PostDTO })
  post!: PostDTO;
}
