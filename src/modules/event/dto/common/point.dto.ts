import { ApiProperty } from '@nestjs/swagger';
import { Point } from '@volontariapp/contracts-nest';

export class PointDTO implements Point {
  @ApiProperty({ example: 48.8566 })
  latitude!: number;

  @ApiProperty({ example: 2.3522 })
  longitude!: number;
}
