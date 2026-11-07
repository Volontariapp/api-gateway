import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import {
  DEFAULT_LIVE_REVOKE_REASON,
  LIVE_REVOKE_REASONS,
  type LiveRevokeReason,
} from '../../constants/live.constants.js';

/** Query string of `DELETE /live/events/:eventId/sharing`. */
export class StopLiveSharingQueryDTO {
  @ApiPropertyOptional({
    enum: LIVE_REVOKE_REASONS,
    default: DEFAULT_LIVE_REVOKE_REASON,
    description:
      'Why the sharing stops. ARRIVED: the client detected the arrival. STOPPED: voluntary stop, ' +
      'app in background, permission removed. LEFT: the user leaves the event.',
  })
  @IsOptional()
  @IsIn(LIVE_REVOKE_REASONS)
  reason?: LiveRevokeReason;

  toReason(): LiveRevokeReason {
    return this.reason ?? DEFAULT_LIVE_REVOKE_REASON;
  }
}
