import {
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Param,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { ClientGrpc } from '@nestjs/microservices';
import { POST_SERVICE_NAME, PostServiceClient } from '@volontariapp/contracts';
import type { PostQuery, ListPostsQuery } from '@volontariapp/contracts';
import { POST_PACKAGE } from '../../../grpc/grpc-packages.js';

@ApiTags('Posts')
@Controller('posts')
export class PostQueryController implements OnModuleInit {
  private postService!: PostServiceClient;

  constructor(@Inject(POST_PACKAGE) private client: ClientGrpc) {}

  onModuleInit() {
    this.postService =
      this.client.getService<PostServiceClient>(POST_SERVICE_NAME);
  }

  @ApiOperation({ summary: 'List all posts' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'authorId', required: false, type: String })
  @Get()
  listPosts(
    @Query() query: { page?: number; limit?: number; authorId?: string },
  ) {
    return this.postService.listPosts({
      pagination: {
        page: query.page ?? 1,
        limit: query.limit ?? 10,
      },
      authorId: query.authorId,
    } as ListPostsQuery);
  }

  @ApiOperation({ summary: 'Get a post by ID' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @Get(':id')
  getPost(@Param('id') id: string) {
    return this.postService.getPost({ id } as PostQuery);
  }
}
