import { Controller, Get, Query, Req } from '@nestjs/common';
import { Logger } from '@volontariapp/logger';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Metadata } from '@grpc/grpc-js';
import { GatewayController } from '../../../../../common/decorators/gateway-controller.decorator.js';
import { GetTagsRequestDTO } from '../../../dto/request/index.js';
import { GetTagsResponseDTO } from '../../../dto/response/index.js';
import { BaseTagGrpcController } from '../../base-grpc.controller.js';

@GatewayController('Tags', {
  extraModels: [GetTagsResponseDTO],
})
@Controller('tags')
export class TagQueryController extends BaseTagGrpcController {
  private readonly logger = new Logger({ context: TagQueryController.name });

  @ApiOperation({
    summary: 'List all tags',
    description: 'Fetch a paginated list of all event tags.',
  })
  @ApiResponse({ status: 200, type: GetTagsResponseDTO })
  @Get()
  listTags(@Query() request: GetTagsRequestDTO, @Req() req: Record<string, unknown>) {
    this.logger.log('Listing tags');
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.getTags(request.toQuery(), metadata);
  }
}
