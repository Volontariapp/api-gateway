import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import { UpdatePostCommand } from '@volontariapp/contracts-nest';
import { UpdatePostRequest } from '@volontariapp/contracts';
import { CreatePostRequestDTO } from './create-post.request.dto.js';

export class UpdatePostRequestDTO
  extends PartialType(OmitType(CreatePostRequestDTO, ['toCommand'] as const))
  implements UpdatePostRequest
{
  @ApiProperty({ example: 'uuid-123' })
  id!: string;

  toCommand(): UpdatePostCommand {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
    };
  }
}
