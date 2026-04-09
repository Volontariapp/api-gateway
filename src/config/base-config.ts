import {
  BackendConfig,
  GatewayAuthConfig,
  PostgresConfig,
  MSURLsConfig,
} from '@volontariapp/config';
import { Type } from 'class-transformer';
import { IsDefined, ValidateNested } from 'class-validator';

export class CustomConfig extends BackendConfig {
  @IsDefined()
  @Type(() => Number)
  declare port: number;

  @IsDefined()
  @ValidateNested()
  @Type(() => MSURLsConfig)
  declare microServices: MSURLsConfig;

  @IsDefined()
  @ValidateNested()
  @Type(() => GatewayAuthConfig)
  declare auth: GatewayAuthConfig;

  @IsDefined()
  @ValidateNested()
  @Type(() => PostgresConfig)
  db!: PostgresConfig;
}
