import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get port(): number {
    return this.configService.getOrThrow<number>('PORT');
  }

  get msUserUrl(): string {
    return this.configService.getOrThrow<string>('MS_USER_URL');
  }

  get msPostUrl(): string {
    return this.configService.getOrThrow<string>('MS_POST_URL');
  }

  get msEventUrl(): string {
    return this.configService.getOrThrow<string>('MS_EVENT_URL');
  }
}
