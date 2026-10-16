import { ApiProperty } from '@nestjs/swagger';
import type { GetPostResponse } from '@volontariapp/contracts-nest';
import { PostWebResponse } from '@volontariapp/contracts';
import { PostDTO } from '../common/post.dto.js';
import type { PostMediaUrlBuilder } from '../common/post-media-url.builder.js';

import { EventDTO } from '../../../event/dto/common/event.dto.js';

export class PostResponseDTO implements PostWebResponse {
  static fromResponse(
    response: GetPostResponse,
    urls: PostMediaUrlBuilder,
    event?: EventDTO,
  ): PostResponseDTO {
    const dto = new PostResponseDTO();
    dto.post = response.post ? PostDTO.fromPost(response.post, urls, event) : new PostDTO();
    return dto;
  }

  @ApiProperty({ type: PostDTO })
  post!: PostDTO;
}
