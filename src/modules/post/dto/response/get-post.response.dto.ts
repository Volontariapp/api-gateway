import { ApiProperty } from '@nestjs/swagger';
import { GetPostResponse } from '@volontariapp/contracts-nest';
import { PostWebResponse } from '@volontariapp/contracts';
import { PostDTO } from '../common/post.dto.js';
import type { PostMediaUrlBuilder } from '../common/post-media-url.builder.js';

import { EventDTO } from '../../../event/dto/common/event.dto.js';

export class GetPostResponseDTO implements PostWebResponse {
  static fromResponse(
    response: GetPostResponse,
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
