import { Controller, Get, Param, Query, Req, Inject } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Logger } from '@volontariapp/logger';
import { firstValueFrom } from 'rxjs';

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
import { EventDTO } from '../../../../event/dto/common/event.dto.js';

import { EVENT_PACKAGE, POST_PACKAGE } from '../../../../../grpc/grpc-packages.js';
import {
  EventQueryServiceClient,
  EVENT_QUERY_SERVICE_NAME,
  GetEventsByIdsResponse,
  GetEventResponse,
  ListPostsResponse,
  GetPostResponse,
} from '@volontariapp/contracts-nest';
import { WithMetadata } from '../../../../../common/types/grpc.types.js';

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
  private eventQueryService!: WithMetadata<EventQueryServiceClient>;

  constructor(
    @Inject(POST_PACKAGE) client: ClientGrpc,
    @Inject(EVENT_PACKAGE) private readonly eventClient: ClientGrpc,
  ) {
    super(client);
  }

  onModuleInit() {
    super.onModuleInit();
    this.eventQueryService = this.eventClient.getService<EventQueryServiceClient>(
      EVENT_QUERY_SERVICE_NAME,
    ) as WithMetadata<EventQueryServiceClient>;
  }

  @ApiOperation({ summary: 'List all posts' })
  @ApiResponse({ status: 200, type: ListPostsResponseDTO })
  @Get()
  async listPosts(
    @Query() request: ListPostsRequestDTO,
    @Req() req: Record<string, unknown>,
  ): Promise<ListPostsResponseDTO> {
    this.logger.log('Listing posts');
    const metadata = req['internalMetadata'] as Metadata;

    const res = await firstValueFrom<ListPostsResponse>(
      this.postService.listPosts(request.toQuery(), metadata),
    );

    const eventIds = [
      ...new Set(res.posts.map((p) => p.eventId).filter((id): id is string => !!id)),
    ];
    const eventsMap = new Map<string, EventDTO>();

    if (eventIds.length > 0) {
      try {
        const eventsRes = await firstValueFrom<GetEventsByIdsResponse>(
          this.eventQueryService.getEventsByIds({ ids: eventIds }, metadata),
        );
        for (const ev of eventsRes.events) {
          eventsMap.set(ev.id, EventDTO.fromResponse(ev));
        }
      } catch (err) {
        this.logger.error('Failed to fetch events for posts', err as Error);
      }
    }

    return ListPostsResponseDTO.fromResponse(res, eventsMap);
  }

  @ApiOperation({ summary: 'Get a post by ID' })
  @ApiParam({ name: 'id', example: 'uuid-123' })
  @ApiResponse({ status: 200, type: PostResponseDTO })
  @CustomApiError(() => POST_NOT_FOUND('id'))
  @Get(':id')
  async getPost(
    @Param('id') id: string,
    @Req() req: Record<string, unknown>,
  ): Promise<GetPostResponseDTO> {
    this.logger.log(`Fetching post with id: ${id}`);
    const request = new GetPostRequestDTO();
    request.id = id;
    const metadata = req['internalMetadata'] as Metadata;

    const res = await firstValueFrom<GetPostResponse>(
      this.postService.getPost(request.toQuery(), metadata),
    );

    let eventDto: EventDTO | undefined;
    if (res.post?.eventId) {
      try {
        const eventRes = await firstValueFrom<GetEventResponse>(
          this.eventQueryService.getEvent({ id: res.post.eventId }, metadata),
        );
        if (eventRes.event) {
          eventDto = EventDTO.fromResponse(eventRes.event);
        }
      } catch (err) {
        this.logger.error(`Failed to fetch event for post ${id}`, err as Error);
      }
    }

    return GetPostResponseDTO.fromResponse(res, eventDto);
  }
}
