import { ApiProperty } from '@nestjs/swagger';
import { CreatePostCommand } from '@volontariapp/contracts-nest';
import { CreatePostRequest } from '@volontariapp/contracts';

export class CreatePostRequestDTO implements CreatePostRequest {
  @ApiProperty({ example: 'My first post' })
  title!: string;

  @ApiProperty({ example: 'My first post' })
  content!: string;

  @ApiProperty({ example: 'event-id', required: false })
  eventId?: string;

  @ApiProperty({ example: ['76c5b964-b5a1-43e3-85e2-040683457e56'], isArray: true })
  fileIds: string[] = [];

  @ApiProperty({ example: '5d0e4a3c-7f0b-4b76-9a52-0d1f4f3b9e11' })
  idempotencyKey!: string;

  toCommand(): CreatePostCommand {
    return {
      title: this.title,
      content: this.content,
      eventId: this.eventId,
      fileIds: this.fileIds,
      idempotencyKey: this.idempotencyKey,
    };
  }
}
