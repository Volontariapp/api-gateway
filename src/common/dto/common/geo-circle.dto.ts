import { ApiProperty } from '@nestjs/swagger';
import type { GeoCircle } from '@volontariapp/contracts-nest';
import { PointDTO } from './point.dto.js';

export class GeoCircleDTO implements GeoCircle {
  @ApiProperty({ type: PointDTO })
  center!: PointDTO;

  @ApiProperty({ example: 1000 })
  radiusMeters!: number;
}
