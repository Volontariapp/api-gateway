import { ApiProperty } from '@nestjs/swagger';
import type { RecordEventFeedbackResponse } from '@volontariapp/contracts-nest';
import type { RecordEventFeedbackWebResponse } from '@volontariapp/contracts';

export class RecordEventFeedbackResponseDTO implements RecordEventFeedbackWebResponse {
  static fromResponse(response: RecordEventFeedbackResponse): RecordEventFeedbackResponseDTO {
    const dto = new RecordEventFeedbackResponseDTO();
    dto.recorded = response.recorded;
    return dto;
  }

  @ApiProperty({ example: 5, description: 'Number of swipes recorded' })
  recorded!: number;
}
