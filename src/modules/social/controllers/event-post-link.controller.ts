import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Inject,
  OnModuleInit,
  Query,
  Req,
} from '@nestjs/common';
import { map } from 'rxjs';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import type { ClientGrpc } from '@nestjs/microservices';
import type { Metadata } from '@grpc/grpc-js';
import { WithMetadata } from '../../../common/types/grpc.types.js';
import { SOCIAL_PACKAGE } from '../../../grpc/grpc-packages.js';
import {
  EVENT_POST_LINK_COMMAND_SERVICE_NAME,
  EventPostLinkCommandServiceClient,
  EVENT_POST_LINK_QUERY_SERVICE_NAME,
  EventPostLinkQueryServiceClient,
  PARTICIPATION_QUERY_SERVICE_NAME,
  ParticipationQueryServiceClient,
} from '@volontariapp/contracts-nest';
import { firstValueFrom } from 'rxjs';
import { Roles } from '@volontariapp/auth';
import { GatewayController } from '../../../common/decorators/gateway-controller.decorator.js';
import { UserRoles } from '@volontariapp/shared';
import {
  ActionSuccessResponseDTO,
  IdsListResponseDTO,
  EventIdResponseDTO,
} from '../dto/response/index.js';
import { GetEventPostsRequestDTO } from '../dto/request/index.js';
import { CustomApiError, DATABASE_ERROR, EVENT_NOT_FOUND } from '@volontariapp/errors-nest';

@GatewayController('Social - Event-Post Links', {
  admin: true,
  forbiddenMessage: 'You do not have permission to access this resource',
})
@Controller('social')
export class EventPostLinkController implements OnModuleInit {
  private commandService!: WithMetadata<EventPostLinkCommandServiceClient>;
  private queryService!: WithMetadata<EventPostLinkQueryServiceClient>;
  private participationQueryService!: WithMetadata<ParticipationQueryServiceClient>;

  constructor(@Inject(SOCIAL_PACKAGE) private client: ClientGrpc) {}

  onModuleInit() {
    this.commandService = this.client.getService<EventPostLinkCommandServiceClient>(
      EVENT_POST_LINK_COMMAND_SERVICE_NAME,
    );
    this.queryService = this.client.getService<EventPostLinkQueryServiceClient>(
      EVENT_POST_LINK_QUERY_SERVICE_NAME,
    );
    this.participationQueryService = this.client.getService<ParticipationQueryServiceClient>(
      PARTICIPATION_QUERY_SERVICE_NAME,
    );
  }

  @Post('events/:eventId/posts/:postId')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Link a post to an event' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiParam({ name: 'postId', example: 'uuid-post-123' })
  @ApiResponse({ status: 201, type: ActionSuccessResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('linking post to event', 'details'))
  linkPostToEvent(
    @Param('eventId') eventId: string,
    @Param('postId') postId: string,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .linkPostToEvent({ eventId, postId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Post linked to event' })));
  }

  @Delete('events/:eventId/posts/:postId')
  @Roles(UserRoles.ADMIN)
  @ApiOperation({ summary: 'Unlink a post from an event' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiParam({ name: 'postId', example: 'uuid-post-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('unlinking post from event', 'details'))
  unlinkPostFromEvent(
    @Param('eventId') eventId: string,
    @Param('postId') postId: string,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.commandService
      .unlinkPostFromEvent({ eventId, postId }, metadata)
      .pipe(map(() => ({ success: true, message: 'Post unlinked from event' })));
  }

  @Get('posts/:postId/related-event')
  @ApiOperation({ summary: 'Get event related to a specific post' })
  @ApiParam({ name: 'postId', example: 'uuid-post-123' })
  @ApiResponse({ status: 200, type: EventIdResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching event related to post', 'details'))
  getEventRelatedToPost(@Param('postId') postId: string, @Req() req: Record<string, unknown>) {
    const metadata = req['internalMetadata'] as Metadata;
    return this.queryService.getEventRelatedToPost({ postId }, metadata);
  }

  @Get('events/:eventId/related-posts')
  @ApiOperation({ summary: 'Get posts related to a specific event' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  @CustomApiError(() => DATABASE_ERROR('fetching event posts', 'details'))
  async getEventPosts(
    @Param('eventId') eventId: string,
    @Query() query: GetEventPostsRequestDTO,
    @Req() req: Record<string, unknown>,
  ) {
    const metadata = req['internalMetadata'] as Metadata;
    const nodeRes = await firstValueFrom(
      this.participationQueryService.getEventNode({ eventId }, metadata),
    );
    if (!nodeRes.exists) throw EVENT_NOT_FOUND(eventId);
    query.eventId = eventId;
    return this.queryService.getEventPosts(query.toQuery(), metadata);
  }
}
