import { ApiProperty } from '@nestjs/swagger';
import { Point } from '@volontariapp/contracts-nest';
import { IsNumber } from 'class-validator';

export class PointDTO implements Point {
  @ApiProperty({ example: 48.8566 })
  @IsNumber()
  latitude!: number;

  @ApiProperty({ example: 2.3522 })
  @IsNumber()
  longitude!: number;
}
