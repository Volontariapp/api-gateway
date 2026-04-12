import { ApiProperty } from '@nestjs/swagger';
import { GetPostResponse } from '@volontariapp/contracts-nest';
import { PostWebResponse } from '@volontariapp/contracts';
import { PostDTO } from '../common/post.dto.js';

export class PostResponseDTO implements GetPostResponse, PostWebResponse {
  @ApiProperty({ type: PostDTO })
  post!: PostDTO;
}
