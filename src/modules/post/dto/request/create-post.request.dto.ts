import { ApiProperty } from '@nestjs/swagger';
import { CreatePostCommand } from '@volontariapp/contracts-nest';
import { CreatePostRequest } from '@volontariapp/contracts';

export class CreatePostRequestDTO implements CreatePostRequest {
  @ApiProperty({ example: 'My first post' })
  title!: string;

  @ApiProperty({ example: 'My first post' })
  content!: string;

  toCommand(): CreatePostCommand {
    return {
      title: this.title,
      content: this.content,
    };
  }
}
