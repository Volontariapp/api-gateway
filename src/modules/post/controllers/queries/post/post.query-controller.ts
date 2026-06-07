import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { Logger } from '@volontariapp/logger';
import { map, Observable } from 'rxjs';

import {
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiResponse,
  ApiExtraModels,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  CustomApiError,
  MISSING_ACCESS_TOKEN,
  ApiUnauthorizedResponse,
  POST_NOT_FOUND,
} from '@volontariapp/errors-nest';
import type { Metadata } from '@grpc/grpc-js';

import { BasePostGrpcController } from '../../base-grpc.controller.js';
import { GatewayController } from '../../../../../common/decorators/gateway-controller.decorator.js';

import { ListPostsRequestDTO, GetPostRequestDTO } from '../../../dto/request/index.js';
import { PostResponseDTO, ListPostsResponseDTO } from '../../../dto/response/index.js';
import { GetPostResponseDTO } from '../../../dto/response/get-post.response.dto.js';

@ApiTags('Posts')
@ApiExtraModels(PostResponseDTO, ListPostsResponseDTO, GetPostResponseDTO)
@ApiBearerAuth('access-token')
@CustomApiError(MISSING_ACCESS_TOKEN)
@ApiUnauthorizedResponse('Missing or invalid access token')
@ApiForbiddenResponse('You do not have permission to manage posts')
@ApiInternalServerErrorResponse('An unexpected error occurred on the server')
@GatewayController(`Post`)
@Controller('posts')
export class PostQueryController extends BasePostGrpcController {
  private readonly logger = new Logger({ context: PostQueryController.name });

  @ApiOperation({ summary: 'List all posts' })
  @ApiResponse({ status: 200, type: ListPostsResponseDTO })
  @Get()
  listPosts(
    @Query() request: ListPostsRequestDTO,
    @Req() req: Record<string, unknown>,
  ): Observable<ListPostsResponseDTO> {
    this.logger.log('Listing posts');
    const metadata = req['internalMetadata'] as Metadata;

    return this.postService
      .listPosts(request.toQuery(), metadata)
      .pipe(map((res) => ListPostsResponseDTO.fromResponse(res)));
  }

  @ApiOperation({ summary: 'Get a post by ID' })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({ status: 200, type: PostResponseDTO })
  @CustomApiError(() => POST_NOT_FOUND('id'))
  @Get(':id')
  getPost(
    @Param('id') id: string,
    @Req() req: Record<string, unknown>,
  ): Observable<GetPostResponseDTO> {
    this.logger.log(`Fetching post with id: ${id}`);
    const request = new GetPostRequestDTO();
    request.id = id;
    const metadata = req['internalMetadata'] as Metadata;

    return this.postService
      .getPost(request.toQuery(), metadata)
      .pipe(map((res) => GetPostResponseDTO.fromResponse(res)));
  }
}
