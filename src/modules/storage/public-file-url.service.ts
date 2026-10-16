import { Injectable } from '@nestjs/common';
import { EntityType } from '@volontariapp/domain-storage/enums';
import { buildPublicFileUrl } from '@volontariapp/domain-storage/helpers';
import { Logger } from '@volontariapp/logger';
import { AppConfigService } from '../../config/app-config.service.js';
import type { UserAvatarUrlBuilder } from '../user/dto/common/user-avatar-url.builder.js';

/**
 * Computes the public URL of processed files (pure computation, no call to ms-storage).
 * A missing or invalid configuration never breaks a response: the URL is omitted and logged.
 */
@Injectable()
export class PublicFileUrlService implements UserAvatarUrlBuilder {
  private readonly logger = new Logger({ context: PublicFileUrlService.name });
  private missingBaseUrlLogged = false;

  constructor(private readonly appConfigService: AppConfigService) {}

  forUserAvatar(fileId?: string): string | undefined {
    if (fileId === undefined || fileId === '') {
      return undefined;
    }
    const baseUrl = this.appConfigService.publicFileBaseUrl;
    if (baseUrl === undefined || baseUrl.trim() === '') {
      this.warnMissingBaseUrlOnce();
      return undefined;
    }
    try {
      return buildPublicFileUrl(EntityType.USER_AVATAR, fileId, baseUrl);
    } catch (error: unknown) {
      this.logger.warn(
        `Cannot build the avatar URL for file ${fileId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return undefined;
    }
  }

  private warnMissingBaseUrlOnce(): void {
    if (this.missingBaseUrlLogged) {
      return;
    }
    this.missingBaseUrlLogged = true;
    this.logger.warn(
      'storage.publicBaseUrl (S3_PUBLIC_BASE_URL) is not configured: avatarUrl is omitted from responses',
    );
  }
}
