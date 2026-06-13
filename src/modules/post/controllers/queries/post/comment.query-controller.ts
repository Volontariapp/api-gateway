import { Controller, Get, Param, Query } from '@nestjs/common';
import { Logger } from '@volontariapp/logger';
import { ApiOperation, ApiParam, ApiResponse, ApiTags, ApiExtraModels } from '@nestjs/swagger';
import { CustomApiError, POST_NOT_FOUND } from '@volontariapp/errors-nest';
import { map, Observable } from 'rxjs';
import type { Metadata } from '@grpc/grpc-js';
import { Req } from '@nestjs/common';

import { GatewayController } from '../../../../../common/decorators/gateway-controller.decorator.js';
import { BasePostGrpcController } from '../../base-grpc.controller.js';
import { ListCommentsRequestDTO } from '../../../dto/request/index.js';
import { ListCommentsResponseDTO } from '../../../dto/response/index.js';

@ApiTags('Comments')
@ApiExtraModels(ListCommentsResponseDTO)
@GatewayController(`CommentQuery`)
@Controller('posts/:postId/comments')
export class CommentQueryController extends BasePostGrpcController {
  private readonly logger = new Logger({ context: CommentQueryController.name });

  @ApiOperation({ summary: 'List comments for a post' })
  @ApiParam({ name: 'postId', example: 'uuid-123' })
  @ApiResponse({ status: 200, type: ListCommentsResponseDTO })
  @CustomApiError(() => POST_NOT_FOUND('postId'))
  @Get()
  listComments(
    @Param('postId') postId: string,
    @Query() query: ListCommentsRequestDTO,
    @Req() req: Record<string, unknown>,
  ): Observable<ListCommentsResponseDTO> {
    this.logger.log(`Listing comments for post: ${postId}`);
    const metadata = req['internalMetadata'] as Metadata;
    query.postId = postId;

    return this.postService
      .listComments(query.toQuery(), metadata)
      .pipe(map((res) => ListCommentsResponseDTO.fromResponse(res)));
  }
}
