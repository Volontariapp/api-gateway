import { Injectable } from '@nestjs/common';
import { Logger } from '@volontariapp/logger';
import { Metadata } from '@grpc/grpc-js';
import { JwtService } from '@volontariapp/auth';
import { UserRoles } from '@volontariapp/shared';
import {
  SeedOptionsDTO,
  SeedPreset,
  SeedStatusResponseDTO,
  createInitialSeedStatus,
} from '../common/index.js';
import { UserSeedService } from './user-seed.service.js';
import { TagSeedService } from './tag-seed.service.js';
import { EventSeedService } from './event-seed.service.js';
import { InteractionSeedService } from './interaction-seed.service.js';
import { PostSeedService } from './post-seed.service.js';

@Injectable()
export class SystemSeedService {
  private readonly logger = new Logger({ context: SystemSeedService.name });
  private isRunning = false;
  private lastStatus: SeedStatusResponseDTO = createInitialSeedStatus();

  constructor(
    private readonly jwtService: JwtService,
    private readonly userSeedService: UserSeedService,
    private readonly tagSeedService: TagSeedService,
    private readonly eventSeedService: EventSeedService,
    private readonly interactionSeedService: InteractionSeedService,
    private readonly postSeedService: PostSeedService,
  ) {}

  /**
   * Lance le processus de seed global en arrière-plan.
   */
  seed(
    req: { headers?: Record<string, string | string[] | undefined>; [key: string]: unknown },
    options?: SeedOptionsDTO,
  ): { message: string; options: SeedOptionsDTO } {
    if (this.isRunning) {
      return {
        message: 'A seeding process is already running. Check backend logs for progress.',
        options: options ?? new SeedOptionsDTO(),
      };
    }

    const resolvedOptions = this.resolveOptions(options);

    const baseMetadata = new Metadata();
    const rawHeaders = req.headers;
    const internalHeaders =
      (rawHeaders?.['x-internal-metadata'] as string | undefined) ??
      (req['internalMetadata'] as string | undefined);
    const userIdHeader = rawHeaders?.['x-user-id'] as string | undefined;

    if (internalHeaders && typeof internalHeaders === 'string') {
      baseMetadata.add('internal-metadata', internalHeaders);
    }
    if (userIdHeader && typeof userIdHeader === 'string') {
      baseMetadata.add('user-id', userIdHeader);
    }

    this.isRunning = true;
    this.runBackgroundSeed(baseMetadata, resolvedOptions)
      .catch((err: unknown) => {
        this.logger.error('Background seed failed', err);
      })
      .finally(() => {
        this.isRunning = false;
      });

    return {
      message: `Seeding process started (${options?.preset ? options.preset : 'default'}: ${String(resolvedOptions.userCount)} users, ${String(resolvedOptions.eventCount)} events, ${String(resolvedOptions.postCount)} posts). Check logs for progress.`,
      options: resolvedOptions,
    };
  }

  getLastStatus(): SeedStatusResponseDTO {
    return this.lastStatus;
  }

  private resolveOptions(options?: SeedOptionsDTO): Required<SeedOptionsDTO> {
    const preset = options?.preset ?? SeedPreset.STANDARD;

    let defaultUsers = 100;
    let defaultEvents = 150;
    let defaultPosts = 350;

    if (preset === SeedPreset.QUICK) {
      defaultUsers = 10;
      defaultEvents = 20;
      defaultPosts = 30;
    } else if (preset === SeedPreset.FIVE_HUNDRED) {
      defaultUsers = 500;
      defaultEvents = 500;
      defaultPosts = 500;
    } else if (preset === SeedPreset.MEGA_1000) {
      defaultUsers = 1000;
      defaultEvents = 1500;
      defaultPosts = 3500;
    }

    return {
      preset,
      userCount: options?.userCount ?? defaultUsers,
      eventCount: options?.eventCount ?? defaultEvents,
      postCount: options?.postCount ?? defaultPosts,
      seedMedia: options?.seedMedia ?? true,
      concurrency: options?.concurrency ?? 15,
    };
  }

  private async getMetadataWithInternalToken(
    baseMetadata: Metadata,
    userId: string,
  ): Promise<Metadata> {
    const md = baseMetadata.clone();
    const token = await this.jwtService.signInternal({
      id: userId,
      role: UserRoles.VOLUNTEER,
    });
    md.add('x-internal-token', token);
    return md;
  }

  private async runBackgroundSeed(
    baseMetadata: Metadata,
    options: Required<SeedOptionsDTO>,
  ): Promise<void> {
    const startTime = Date.now();
    this.logger.log(
      `Starting Global Seed V2 in background [Preset: ${options.preset}, Users: ${String(options.userCount)}, Events: ${String(options.eventCount)}, Posts: ${String(options.postCount)}]...`,
    );

    const status = createInitialSeedStatus();
    this.lastStatus = status;

    const getMetadata = (base: Metadata, userId: string) =>
      this.getMetadataWithInternalToken(base, userId);

    try {
      // 1. Initialiser les Tags officiels dans ms-event
      const tagMap = await this.tagSeedService.ensureTags(baseMetadata);

      // 2. Créer les Golden Personas et les utilisateurs Faker dans ms-user et ms-social
      const { goldenUserIds, userIds } = await this.userSeedService.seedUsers(
        options.userCount,
        options.concurrency,
        baseMetadata,
        status.users,
      );

      if (userIds.length === 0) {
        throw new Error('No users could be created. Aborting seed pipeline.');
      }

      // 3. Créer les événements passés (-90j à -1j) et futurs (+1j à +180j) avec tags et images
      const {
        pastEventIds,
        futureEventIds,
        allEventIds,
        eventCategoryMap,
        eventOwnerMap,
        eventCapacityMap,
      } = await this.eventSeedService.seedEvents(
        userIds,
        goldenUserIds,
        tagMap,
        options.eventCount,
        options.concurrency,
        options.seedMedia,
        getMetadata,
        baseMetadata,
        status.events,
      );

      // 4. Créer les interactions (participations passées cruciales pour le ranking, inscriptions futures, wishes, follows)
      await this.interactionSeedService.seedInteractions(
        userIds,
        goldenUserIds,
        pastEventIds,
        futureEventIds,
        eventCategoryMap,
        eventOwnerMap,
        eventCapacityMap,
        options.concurrency,
        getMetadata,
        baseMetadata,
        status,
      );

      // 5. Créer les posts liés aux événements avec photos uniques, commentaires et likes
      await this.postSeedService.seedPostsAndInteractions(
        userIds,
        allEventIds,
        pastEventIds,
        options.postCount,
        options.concurrency,
        options.seedMedia,
        getMetadata,
        baseMetadata,
        status,
      );

      status.durationMs = Date.now() - startTime;
      this.logger.log(
        `🎉 Global Seeding completed successfully in ${(status.durationMs / 1000).toFixed(1)}s!`,
      );
      this.logger.log(
        `Scoring seed: ${String(status.attendances.success)} attendances checked in, ${String(status.finishedEvents.success)} events finished, ${String(status.cancelledEvents.success)} events cancelled (impact scores are credited by the async pipeline).`,
      );
      this.logger.log(`📊 Final Status Report: ${JSON.stringify(status, null, 2)}`);
    } catch (error) {
      status.durationMs = Date.now() - startTime;
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`💥 Fatal error during background seeding: ${msg}`, error);
    }
  }
}
