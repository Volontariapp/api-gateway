import { ApiProperty } from '@nestjs/swagger';
import { PostWebResponse } from '@volontariapp/contracts';
import { PostDTO } from '../common/post.dto.js';
import type { PostMediaUrlBuilder } from '../common/post-media-url.builder.js';
import type { PostOnWire } from '../common/post-media.dto.js';

import { EventDTO } from '../../../event/dto/common/event.dto.js';

export class PostResponseDTO implements PostWebResponse {
  static fromResponse(
    response: { post: PostOnWire | undefined },
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
