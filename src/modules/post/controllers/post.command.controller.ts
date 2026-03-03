import {
  Body,
  Controller,
  Delete,
  Inject,
  OnModuleInit,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { ClientGrpc } from '@nestjs/microservices';
import { POST_SERVICE_NAME, PostServiceClient } from '@volontariapp/contracts';
import type {
  CreatePostCommand,
  UpdatePostCommand,
} from '@volontariapp/contracts';
import { POST_PACKAGE } from '../../../grpc/grpc-packages.js';

@ApiTags('Posts')
@Controller('posts')
export class PostCommandController implements OnModuleInit {
  private postService!: PostServiceClient;

  constructor(@Inject(POST_PACKAGE) private client: ClientGrpc) {}

  onModuleInit() {
    this.postService =
      this.client.getService<PostServiceClient>(POST_SERVICE_NAME);
  }

  @ApiOperation({ summary: 'Create a new post' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        authorId: {
          type: 'string',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        title: { type: 'string', example: 'My First Post' },
        content: {
          type: 'string',
          example: 'This is the content of the post.',
        },
      },
    },
  })
  @Post()
  createPost(@Body() command: CreatePostCommand) {
    return this.postService.createPost(command);
  }

  @ApiOperation({ summary: 'Update a post by ID' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'My Updated Post Title' },
        content: { type: 'string', example: 'This is the updated content.' },
      },
    },
  })
  @Patch(':id')
  updatePost(
    @Param('id') id: string,
    @Body() command: Partial<UpdatePostCommand>,
  ) {
    return this.postService.updatePost({
      ...command,
      id,
    } as UpdatePostCommand);
  }

  @ApiOperation({ summary: 'Delete a post by ID' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @Delete(':id')
  deletePost(@Param('id') id: string) {
    return this.postService.deletePost({ id });
  }
}
