import { ApiProperty } from '@nestjs/swagger';
import { GeoCircle } from '@volontariapp/contracts-nest';
import { PointDTO } from '../common/point.dto.js';

export class GeoCircleRequestDTO implements GeoCircle {
  @ApiProperty({ type: PointDTO })
  center!: PointDTO;

  @ApiProperty({ example: 1000 })
  radiusMeters!: number;
}
