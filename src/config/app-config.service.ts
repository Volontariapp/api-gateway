import type { CustomConfig } from './base-config.js';

export class AppConfigService {
  constructor(public readonly config: CustomConfig) {}
}
