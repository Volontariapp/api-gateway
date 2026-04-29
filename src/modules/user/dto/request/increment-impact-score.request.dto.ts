import { ApiProperty } from '@nestjs/swagger';

export class IncrementImpactScoreRequestDTO {
  @ApiProperty({ example: 10 })
  scoreIncrement!: number;
}
