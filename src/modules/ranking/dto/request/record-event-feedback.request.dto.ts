import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import type { RecordEventFeedbackCommand } from '@volontariapp/contracts-nest';
import type { RecordEventFeedbackWebRequest } from '@volontariapp/contracts';
import { RANKING_FEEDBACK_MAX_BATCH } from '../../constants/ranking.constants.js';
import { EventFeedbackItemRequestDTO } from './event-feedback-item.request.dto.js';

export class RecordEventFeedbackRequestDTO implements RecordEventFeedbackWebRequest {
  @ApiProperty({
    type: [EventFeedbackItemRequestDTO],
    description: `Left swipes sent in one batch, ${String(RANKING_FEEDBACK_MAX_BATCH)} at most`,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(RANKING_FEEDBACK_MAX_BATCH)
  @ValidateNested({ each: true })
  @Type(() => EventFeedbackItemRequestDTO)
  items!: EventFeedbackItemRequestDTO[];

  toCommand(): RecordEventFeedbackCommand {
    return { items: this.items.map((item) => item.toCommand()) };
  }
}
