import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsUUID } from 'class-validator';
import type { EventFeedbackItem } from '@volontariapp/contracts-nest';
import type { EventFeedbackWebItem, FeedbackActionWeb } from '@volontariapp/contracts';
import { RANKING_FEEDBACK_ACTIONS } from '../../constants/ranking.constants.js';
import { toFeedbackActionGrpc } from '../../helpers/ranking-wire.helper.js';

export class EventFeedbackItemRequestDTO implements EventFeedbackWebItem {
  @ApiProperty({ example: '76c5b964-b5a1-43e3-85e2-040683457e56' })
  @IsUUID('all')
  eventId!: string;

  @ApiProperty({ enum: RANKING_FEEDBACK_ACTIONS, example: 'PASS' })
  @IsIn(RANKING_FEEDBACK_ACTIONS)
  action!: FeedbackActionWeb;

  toCommand(): EventFeedbackItem {
    return { eventId: this.eventId, action: toFeedbackActionGrpc(this.action) };
  }
}
