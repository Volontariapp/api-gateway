import { BaseConfig, GatewayAuthConfig, MSURLsConfig } from '@volontariapp/config';
import { Type } from 'class-transformer';
import {
  IsDefined,
  IsNotEmpty,
  ValidateNested,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class ExtendedMSURLsConfig extends MSURLsConfig {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  msStorageUrl!: string;
}

export class ExtendedAuthConfig extends GatewayAuthConfig {
  @IsOptional()
  @IsString()
  accessTokenPrivateKeyPath?: string;

  @IsOptional()
  @IsString()
  refreshTokenPrivateKeyPath?: string;

  @IsOptional()
  @IsString()
  accessTokenExpiresIn?: string | number;

  @IsOptional()
  @IsString()
  refreshTokenExpiresIn?: string | number;
}

export class StorageConfig {
  @IsOptional()
  @IsString()
  publicBaseUrl?: string;
}

export class CustomConfig extends BaseConfig {
  @IsDefined()
  @Type(() => Number)
  @IsNumber()
  declare port: number;

  @IsDefined()
  @ValidateNested()
  @Type(() => ExtendedMSURLsConfig)
  declare microServices: ExtendedMSURLsConfig;

  @IsDefined()
  @ValidateNested()
  @Type(() => ExtendedAuthConfig)
  auth!: ExtendedAuthConfig;

  @IsOptional()
  @ValidateNested()
  @Type(() => StorageConfig)
  storage?: StorageConfig;
}
