import { ApiProperty } from '@nestjs/swagger';
import { PostWebResponse } from '@volontariapp/contracts';
import { PostDTO } from '../common/post.dto.js';
import type { PostMediaUrlBuilder } from '../common/post-media-url.builder.js';
import type { PostOnWire } from '../common/post-media.dto.js';

import { EventDTO } from '../../../event/dto/common/event.dto.js';

export class GetPostResponseDTO implements PostWebResponse {
  static fromResponse(
    response: { post: PostOnWire | undefined },
    urls: PostMediaUrlBuilder,
    eventDto?: EventDTO,
  ): GetPostResponseDTO {
    const dto = new GetPostResponseDTO();
    if (response.post) {
      dto.post = PostDTO.fromPost(response.post, urls, eventDto);
    }
    return dto;
  }

  @ApiProperty({ type: PostDTO, required: true })
  post!: PostDTO;
}
