import { AppConfigService } from '../../../config/app-config.service.js';
import { CustomConfig, StorageConfig } from '../../../config/base-config.js';
import { PublicFileUrlService } from '../../../modules/storage/public-file-url.service.js';

export class PublicFileUrlFactory {
  static createConfigService(publicBaseUrl?: string): AppConfigService {
    const config = new CustomConfig();
    if (publicBaseUrl !== undefined) {
      config.storage = Object.assign(new StorageConfig(), { publicBaseUrl });
    }
    return new AppConfigService(config);
  }

  static createService(publicBaseUrl?: string): PublicFileUrlService {
    return new PublicFileUrlService(PublicFileUrlFactory.createConfigService(publicBaseUrl));
  }
}
