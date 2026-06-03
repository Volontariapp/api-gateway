import { ApiProperty } from '@nestjs/swagger';
import { GetPostResponse } from '@volontariapp/contracts-nest';
import { PostWebResponse } from '@volontariapp/contracts';
import { PostDTO } from '../common/post.dto.js';

export class GetPostResponseDTO implements PostWebResponse {
  static fromResponse(response: GetPostResponse): GetPostResponseDTO {
    const dto = new GetPostResponseDTO();
    if (response.post) {
      dto.post = PostDTO.fromResponse(response.post);
    }
    return dto;
  }

  @ApiProperty({ type: PostDTO, required: true })
  post!: PostDTO;
}
