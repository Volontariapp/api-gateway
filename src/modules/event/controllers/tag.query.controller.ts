import { Controller, Get, Inject, OnModuleInit, Query } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import type { ClientGrpc } from '@nestjs/microservices';
import {
  TAG_QUERY_SERVICE_NAME,
  TagQueryServiceClient,
} from '@volontariapp/contracts-nest';
import { EVENT_PACKAGE } from '../../../grpc/grpc-packages.js';
import { GetTagsQueryDTO } from '../dto/request/query/event.query.dto.js';
import { GetTagsResponseDTO } from '../dto/response/event-responses.dto.js';

@ApiTags('Tags')
@Controller('tags')
export class TagQueryController implements OnModuleInit {
  private tagService!: TagQueryServiceClient;

  constructor(@Inject(EVENT_PACKAGE) private client: ClientGrpc) {}

  onModuleInit() {
    this.tagService = this.client.getService<TagQueryServiceClient>(
      TAG_QUERY_SERVICE_NAME,
    );
  }

  @ApiOperation({ summary: 'Get all tags' })
  @ApiResponse({ status: 200, type: GetTagsResponseDTO })
  @Get()
  getTags(@Query() query: GetTagsQueryDTO) {
    return this.tagService.getTags(query.toQuery());
  }
}
