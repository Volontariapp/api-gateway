import type { LoggerFormat } from '@volontariapp/config';
import type { CustomConfig } from './base-config.js';

export class AppConfigService {
  constructor(public readonly config: CustomConfig) {}

  get msUserUrl(): string {
    return this.config.microServices.msUserUrl;
  }

  get msPostUrl(): string {
    return this.config.microServices.msPostUrl;
  }

  get msEventUrl(): string {
    return this.config.microServices.msEventUrl;
  }
  get msSocialUrl(): string {
    return this.config.microServices.msSocialUrl;
  }

  get loggerFormat(): LoggerFormat {
    return this.config.logger.format;
  }

  get loggerLevel(): string {
    return this.config.logger.level;
  }

  get auth() {
    return this.config.auth;
  }
}
