import { ApiProperty } from '@nestjs/swagger';
import { IncrementImpactScoreRequest } from '@volontariapp/contracts';
import { IncrementImpactScoreCommand } from '@volontariapp/contracts-nest';

export class IncrementImpactScoreRequestDTO implements IncrementImpactScoreRequest {
  userId!: string;

  @ApiProperty({ example: 10 })
  scoreIncrement!: number;

  toCommand(): IncrementImpactScoreCommand {
    return {
      userId: this.userId,
      scoreIncrement: this.scoreIncrement,
    };
  }
}
