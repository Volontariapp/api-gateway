import { ApiProperty } from '@nestjs/swagger';
import type { GetPostResponse } from '@volontariapp/contracts-nest';
import { PostWebResponse } from '@volontariapp/contracts';
import { PostDTO } from '../common/post.dto.js';

export class PostResponseDTO implements GetPostResponse, PostWebResponse {
  static fromResponse(response: GetPostResponse): PostResponseDTO {
    const dto = new PostResponseDTO();
    dto.post = response.post as PostDTO;
    return dto;
  }

  @ApiProperty({ type: PostDTO })
  post!: PostDTO;
}
