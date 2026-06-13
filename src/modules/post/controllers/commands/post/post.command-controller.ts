import { Body, Controller, Delete, Param, Patch, Post, Req } from '@nestjs/common';
import { Logger } from '@volontariapp/logger';
import { CurrentUser } from '@volontariapp/auth';
import type { AuthUser } from '@volontariapp/auth';
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
  POST_ALREADY_EXISTS,
} from '@volontariapp/errors-nest';
import { DeletePostCommand } from '@volontariapp/contracts-nest';
import type { Metadata } from '@grpc/grpc-js';

import { BasePostGrpcController } from '../../base-grpc.controller.js';
import { GatewayController } from '../../../../../common/decorators/gateway-controller.decorator.js';

import { CreatePostRequestDTO, UpdatePostRequestDTO } from '../../../dto/request/index.js';
import { PostResponseDTO } from '../../../dto/response/index.js';
import { ActionSuccessResponseDTO } from '../../../../event/dto/response/index.js';

@ApiTags('Posts')
@ApiExtraModels(PostResponseDTO, ActionSuccessResponseDTO)
@ApiBearerAuth('access-token')
@CustomApiError(MISSING_ACCESS_TOKEN)
@ApiUnauthorizedResponse('Missing or invalid access token')
@ApiForbiddenResponse('You do not have permission to manage posts')
@ApiInternalServerErrorResponse('An unexpected error occurred on the server')
@GatewayController(`Post`)
@Controller('posts')
export class PostCommandController extends BasePostGrpcController {
  private readonly logger = new Logger({ context: PostCommandController.name });

  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({ status: 201, type: PostResponseDTO })
  @CustomApiError(() => POST_ALREADY_EXISTS('title'))
  @Post()
  createPost(
    @CurrentUser() user: AuthUser,
    @Body() request: CreatePostRequestDTO,
    @Req() req: Record<string, unknown>,
  ): Observable<PostResponseDTO> {
    this.logger.log(`Creating post by author: ${user.id}`);
    const metadata = req['internalMetadata'] as Metadata;
    return this.postService
      .createPost(request.toCommand(), metadata)
      .pipe(map((res) => PostResponseDTO.fromResponse(res)));
  }

  @ApiOperation({ summary: 'Update a post by ID' })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({ status: 200, type: PostResponseDTO })
  @CustomApiError(() => POST_NOT_FOUND('id'))
  @Patch(':id')
  updatePost(
    @Param('id') id: string,
    @Body() request: UpdatePostRequestDTO,
    @Req() req: Record<string, unknown>,
  ): Observable<PostResponseDTO> {
    this.logger.log(`Updating post: ${id}`);
    request.id = id;
    const metadata = req['internalMetadata'] as Metadata;

    return this.postService
      .updatePost(request.toCommand(), metadata)
      .pipe(map((res) => PostResponseDTO.fromResponse(res)));
  }

  @ApiOperation({ summary: 'Delete a post by ID' })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @CustomApiError(() => POST_NOT_FOUND('id'))
  @Delete(':id')
  deletePost(
    @Param('id') id: string,
    @Req() req: Record<string, unknown>,
  ): Observable<ActionSuccessResponseDTO> {
    this.logger.log(`Deleting post: ${id}`);
    const metadata = req['internalMetadata'] as Metadata;
    const command: DeletePostCommand = { id };

    return this.postService
      .deletePost(command, metadata)
      .pipe(map((res) => ActionSuccessResponseDTO.fromResponse(res)));
  }
}
