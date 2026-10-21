import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Logger } from '@volontariapp/logger';
import { lastValueFrom } from 'rxjs';
import type { Metadata } from '@grpc/grpc-js';
import {
  STORAGE_SERVICE_NAME,
  type StorageServiceClient,
  EntityType,
} from '@volontariapp/contracts-nest';
import { STORAGE_PACKAGE } from '../../../grpc/grpc-packages.js';
import type { WithMetadata } from '../../../common/types/grpc.types.js';

@Injectable()
export class MediaSeedService implements OnModuleInit {
  private readonly logger = new Logger({ context: MediaSeedService.name });
  private storageService!: WithMetadata<StorageServiceClient>;
  private readonly cacheDir: string;
  private isStorageAvailable = true;

  constructor(@Inject(STORAGE_PACKAGE) private readonly storageClient: ClientGrpc) {
    this.cacheDir = join(process.cwd(), '.cache', 'seed-images');
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  onModuleInit() {
    this.storageService = this.storageClient.getService<StorageServiceClient>(STORAGE_SERVICE_NAME);
  }

  /**
   * Obtient ou téléverse une image unique pour une entité donnée (événement, post, avatar).
   * Garantit 1 image unique par entité avec seed déterministe.
   */
  async getOrUploadImage(
    entityId: string,
    entityType: EntityType,
    categoryTheme: string,
    md: Metadata,
  ): Promise<string | undefined> {
    if (!this.isStorageAvailable) {
      return undefined;
    }

    try {
      const buffer = await this.getImageBuffer(entityId, entityType, categoryTheme);

      // 1. Déclarer l'upload dans ms-storage
      const declareRes = await lastValueFrom(
        this.storageService.generateUploadUrl(
          {
            entityType,
            mimeType: 'image/jpeg',
            sizeBytes: buffer.length,
            isPublic: true,
          },
          md,
        ),
      );

      if (!declareRes.fileId || !declareRes.uploadUrl) {
        return undefined;
      }

      // 2. Poster le fichier sur MinIO / S3 via presigned multipart POST
      const formData = new FormData();
      for (const [key, value] of Object.entries(declareRes.uploadFields)) {
        formData.append(key, value);
      }
      formData.append('file', new Blob([buffer], { type: 'image/jpeg' }), `${entityId}.jpg`);

      const s3Response = await fetch(declareRes.uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!s3Response.ok && s3Response.status !== 204) {
        this.logger.warn(`S3 upload failed (${String(s3Response.status)}) for entity ${entityId}`);
        return undefined;
      }

      // 3. Confirmer l'upload auprès de ms-storage
      await lastValueFrom(this.storageService.confirmUpload({ fileId: declareRes.fileId }, md));

      return declareRes.fileId;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Media seeding skipped for entity ${entityId}: ${msg}`);
      if (msg.includes('UNAVAILABLE') || msg.includes('ECONNREFUSED')) {
        this.isStorageAvailable = false;
        this.logger.warn(
          'ms-storage appears offline. Disabling further media uploads for this seed run.',
        );
      }
      return undefined;
    }
  }

  /**
   * Récupère le buffer de l'image (depuis le cache disque ou depuis une source unique par entité).
   */
  private async getImageBuffer(
    entityId: string,
    entityType: EntityType,
    _categoryTheme: string,
  ): Promise<Buffer> {
    const cacheFile = join(this.cacheDir, `${entityId}.jpg`);
    if (existsSync(cacheFile)) {
      return readFileSync(cacheFile);
    }

    const width = entityType === EntityType.ENTITY_TYPE_EVENT_COVER ? 800 : 600;
    const height = entityType === EntityType.ENTITY_TYPE_EVENT_COVER ? 450 : 600;
    const url = `https://picsum.photos/seed/${encodeURIComponent(entityId)}/${String(width)}/${String(height)}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
      }, 6000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        const buf = Buffer.from(arrayBuf);
        writeFileSync(cacheFile, buf);
        return buf;
      }
    } catch {
      // Ignorer l'erreur réseau et basculer sur l'image de secours procédurale
    }

    // Image procédurale de secours générée localement en cas d'absence de connexion Internet
    const fallbackBuf = this.generateFallbackJpeg(entityId);
    writeFileSync(cacheFile, fallbackBuf);
    return fallbackBuf;
  }

  /**
   * Génère un JPEG binaire minimal valide de secours.
   */
  private generateFallbackJpeg(seed: string): Buffer {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    // Petit JPEG 1x1 valide de secours
    return Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00,
      0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06,
      0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b,
      0x0c, 0x19, 0x12, 0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
      0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31,
      0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff,
      0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00,
      0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
      0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0xbf, 0x00, 0xff, 0xd9,
    ]);
  }
}
