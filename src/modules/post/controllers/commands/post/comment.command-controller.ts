import { Body, Controller, Delete, Param, Post, Req } from '@nestjs/common';
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
} from '@volontariapp/errors-nest';
import { DeleteCommentCommand } from '@volontariapp/contracts-nest';
import type { Metadata } from '@grpc/grpc-js';

import { BasePostGrpcController } from '../../base-grpc.controller.js';
import { GatewayController } from '../../../../../common/decorators/gateway-controller.decorator.js';

import { CreateCommentRequestDTO } from '../../../dto/request/index.js';
import { CommentResponseDTO } from '../../../dto/response/index.js';
import { ActionSuccessResponseDTO } from '../../../../event/dto/response/index.js';
import { Comment } from '@volontariapp/contracts';

@ApiTags('Comments')
@ApiExtraModels(CommentResponseDTO, ActionSuccessResponseDTO)
@ApiBearerAuth('access-token')
@CustomApiError(MISSING_ACCESS_TOKEN)
@ApiUnauthorizedResponse('Missing or invalid access token')
@ApiForbiddenResponse('You do not have permission to manage comments')
@ApiInternalServerErrorResponse('An unexpected error occurred on the server')
@GatewayController(`Comment`)
@Controller('posts/:postId/comments')
export class CommentCommandController extends BasePostGrpcController {
  private readonly logger = new Logger({ context: CommentCommandController.name });

  @ApiOperation({ summary: 'Create a comment on a post' })
  @ApiParam({ name: 'postId', example: 'uuid-123' })
  @ApiResponse({ status: 201, type: CommentResponseDTO })
  @CustomApiError(() => POST_NOT_FOUND('postId'))
  @Post()
  createComment(
    @Param('postId') postId: string,
    @CurrentUser() user: AuthUser,
    @Body() request: CreateCommentRequestDTO,
    @Req() req: Record<string, unknown>,
  ): Observable<CommentResponseDTO> {
    this.logger.log(`Creating comment on post ${postId} by author: ${user.id}`);
    const metadata = req['internalMetadata'] as Metadata;
    request.postId = postId;

    return this.postService
      .createComment(request.toCommand(), metadata)
      .pipe(map((res) => CommentResponseDTO.fromResponse(res.comment as Comment)));
  }

  @ApiOperation({ summary: 'Delete a comment by ID' })
  @ApiParam({ name: 'postId', example: 'uuid-123' })
  @ApiParam({ name: 'id', example: 'uuid-comment-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @Delete(':id')
  deleteComment(
    @Param('postId') postId: string,
    @Param('id') id: string,
    @Req() req: Record<string, unknown>,
  ): Observable<ActionSuccessResponseDTO> {
    this.logger.log(`Deleting comment ${id} on post ${postId}`);
    const metadata = req['internalMetadata'] as Metadata;
    const command: DeleteCommentCommand = { id, postId };

    return this.postService
      .deleteComment(command, metadata)
      .pipe(map((res) => ActionSuccessResponseDTO.fromResponse(res)));
  }
}
