import type { BaseConfig } from '@volontariapp/config';

export class AppConfigService {
  constructor(public readonly config: BaseConfig) {}
}
