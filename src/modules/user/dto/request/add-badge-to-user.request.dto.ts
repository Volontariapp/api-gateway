import { ApiProperty } from '@nestjs/swagger';
import { AddBadgeToUserRequest } from '@volontariapp/contracts';
import { AddBadgeToUserCommand } from '@volontariapp/contracts-nest';

export class AddBadgeToUserRequestDTO implements AddBadgeToUserRequest {
  userId!: string;

  @ApiProperty({ example: 'uuid-badge-123' })
  badgeId!: string;

  toCommand(): AddBadgeToUserCommand {
    return {
      userId: this.userId,
      badgeId: this.badgeId,
    };
  }
}
