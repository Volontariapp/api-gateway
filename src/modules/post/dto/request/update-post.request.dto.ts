import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import type { UpdatePostCommand } from '@volontariapp/contracts-nest';
import { CreatePostRequestDTO } from './create-post.request.dto.js';
import type { UpdatePostRequest } from '@volontariapp/contracts';

export class UpdatePostRequestDTO
  extends PartialType(OmitType(CreatePostRequestDTO, ['toCommand'] as const))
  implements UpdatePostRequest
{
  @ApiProperty({ example: 'uuid-123' })
  id!: string;

  post?: UpdatePostRequest['post']; // Ne pas garder cette ecritre c'est interdit
  updateMask?: UpdatePostRequest['updateMask'];

  toCommand(): UpdatePostCommand {
    const updateMask: string[] = [];

    if (this.title) updateMask.push('title');
    if (this.content) updateMask.push('content');

    return {
      post: {
        id: this.id,
        title: this.title ?? '',
        content: this.content ?? '',
        authorId: '',
      },
      updateMask,
    };
  }
}
