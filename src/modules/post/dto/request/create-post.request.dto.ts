import { ApiProperty } from '@nestjs/swagger';
import { CreatePostCommand } from '@volontariapp/contracts-nest';
import { CreatePostRequest } from '@volontariapp/contracts';
import { ArrayMaxSize, IsArray, IsNotEmpty, IsString, IsUUID } from 'class-validator';

/** Mirrors the POST validation policy of domain-storage (maxPerEntity); ms-storage stays the authority. */
export const MAX_FILES_PER_POST = 10;

export class CreatePostRequestDTO implements CreatePostRequest {
  @ApiProperty({ example: 'My first post' })
  title!: string;

  @ApiProperty({ example: 'My first post' })
  content!: string;

  @ApiProperty({ example: 'event-id', required: false })
  eventId?: string;

  @ApiProperty({
    example: ['76c5b964-b5a1-43e3-85e2-040683457e56'],
    isArray: true,
    required: false,
    maxItems: MAX_FILES_PER_POST,
    description: 'Ids of the confirmed uploads to attach, in display order. Never URLs.',
  })
  @IsArray()
  @ArrayMaxSize(MAX_FILES_PER_POST)
  @IsUUID('all', { each: true })
  fileIds: string[] = [];

  @ApiProperty({
    example: '5d0e4a3c-7f0b-4b76-9a52-0d1f4f3b9e11',
    description: 'Client generated key: resending the same key returns the same post',
  })
  @IsString()
  @IsNotEmpty()
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
