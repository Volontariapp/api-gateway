import { Controller, Get, Query, Req } from '@nestjs/common';
import { Logger } from '@volontariapp/logger';
import type { Metadata } from '@grpc/grpc-js';
import { ApiOperation, ApiTags, ApiResponse, ApiExtraModels, ApiBearerAuth } from '@nestjs/swagger';
import {
  ApiInternalServerErrorResponse,
  CustomApiError,
  MISSING_ACCESS_TOKEN,
} from '@volontariapp/errors-nest';
import { GetTagsRequestDTO } from '../../dto/request/index.js';
import { GetTagsResponseDTO } from '../../dto/response/index.js';
import { BaseTagGrpcController } from '../base-grpc.controller.js';

@ApiTags('Tags')
@ApiExtraModels(GetTagsResponseDTO)
@ApiBearerAuth('access-token')
@ApiBearerAuth('refresh-token')
@ApiBearerAuth('internal-token')
@CustomApiError(MISSING_ACCESS_TOKEN)
@ApiInternalServerErrorResponse('An unexpected error occurred on the server')
@Controller('tags')
export class TagQueryController extends BaseTagGrpcController {
  private readonly logger = new Logger({
    context: TagQueryController.name,
  });

  @ApiOperation({ summary: 'Get all tags' })
  @ApiResponse({
    status: 200,
    type: GetTagsResponseDTO,
  })
  @Get()
  getTags(@Query() request: GetTagsRequestDTO, @Req() req: Record<string, unknown>) {
    this.logger.log('Fetching tags');
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.getTags(request.toQuery(), metadata);
  }
}
