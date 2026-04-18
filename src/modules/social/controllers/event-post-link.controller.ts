import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Inject,
  OnModuleInit,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ClientGrpc } from '@nestjs/microservices';
import { SOCIAL_PACKAGE } from '../../../grpc/grpc-packages.js';
import {
  EVENT_POST_LINK_COMMAND_SERVICE_NAME,
  EventPostLinkCommandServiceClient,
  EVENT_POST_LINK_QUERY_SERVICE_NAME,
  EventPostLinkQueryServiceClient,
} from '@volontariapp/contracts-nest';
import {
  ActionSuccessResponseDTO,
  IdsListResponseDTO,
  EventIdResponseDTO,
} from '../dto/response/index.js';
import { GetEventPostsRequestDTO } from '../dto/request/index.js';

@ApiTags('Social - Event-Post Links')
@Controller('social')
export class EventPostLinkController implements OnModuleInit {
  private commandService!: EventPostLinkCommandServiceClient;
  private queryService!: EventPostLinkQueryServiceClient;

  constructor(@Inject(SOCIAL_PACKAGE) private client: ClientGrpc) {}

  onModuleInit() {
    this.commandService =
      this.client.getService<EventPostLinkCommandServiceClient>(
        EVENT_POST_LINK_COMMAND_SERVICE_NAME,
      );
    this.queryService = this.client.getService<EventPostLinkQueryServiceClient>(
      EVENT_POST_LINK_QUERY_SERVICE_NAME,
    );
  }

  @Post('events/:eventId/posts/:postId')
  @ApiOperation({ summary: 'Link a post to an event' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiParam({ name: 'postId', example: 'uuid-post-123' })
  @ApiResponse({ status: 201, type: ActionSuccessResponseDTO })
  linkPostToEvent(
    @Param('eventId') eventId: string,
    @Param('postId') postId: string,
  ) {
    return this.commandService.linkPostToEvent({ eventId, postId });
  }

  @Delete('events/:eventId/posts/:postId')
  @ApiOperation({ summary: 'Unlink a post from an event' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiParam({ name: 'postId', example: 'uuid-post-123' })
  @ApiResponse({ status: 200, type: ActionSuccessResponseDTO })
  unlinkPostFromEvent(
    @Param('eventId') eventId: string,
    @Param('postId') postId: string,
  ) {
    return this.commandService.unlinkPostFromEvent({ eventId, postId });
  }

  @Get('posts/:postId/related-event')
  @ApiOperation({ summary: 'Get event related to a specific post' })
  @ApiParam({ name: 'postId', example: 'uuid-post-123' })
  @ApiResponse({ status: 200, type: EventIdResponseDTO })
  getEventRelatedToPost(@Param('postId') postId: string) {
    return this.queryService.getEventRelatedToPost({ postId });
  }

  @Get('events/:eventId/related-posts')
  @ApiOperation({ summary: 'Get posts related to a specific event' })
  @ApiParam({ name: 'eventId', example: 'uuid-event-123' })
  @ApiResponse({ status: 200, type: IdsListResponseDTO })
  getEventPosts(
    @Param('eventId') eventId: string,
    @Query() query: GetEventPostsRequestDTO,
  ) {
    query.eventId = eventId;
    return this.queryService.getEventPosts(query.toQuery());
  }
}
