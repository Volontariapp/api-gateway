import { ApiProperty } from '@nestjs/swagger';
import { CreateCommentCommand } from '@volontariapp/contracts-nest';
import { CreateCommentRequest } from '@volontariapp/contracts';

export class CreateCommentRequestDTO implements CreateCommentRequest {
  @ApiProperty({ example: 'This is my comment' })
  content!: string;

  postId!: string;

  toCommand(): CreateCommentCommand {
    return {
      postId: this.postId,
      content: this.content,
    };
  }
}
