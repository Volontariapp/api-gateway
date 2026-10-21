import { randomUUID } from 'node:crypto';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Logger } from '@volontariapp/logger';
import { faker } from '@faker-js/faker';
import { lastValueFrom } from 'rxjs';
import type { Metadata } from '@grpc/grpc-js';
import {
  POST_SERVICE_NAME,
  type PostServiceClient,
  PUBLICATION_COMMAND_SERVICE_NAME,
  type PublicationCommandServiceClient,
  INTERACTION_COMMAND_SERVICE_NAME,
  type InteractionCommandServiceClient,
  EntityType,
} from '@volontariapp/contracts-nest';
import { POST_PACKAGE, SOCIAL_PACKAGE } from '../../../grpc/grpc-packages.js';
import type { WithMetadata } from '../../../common/types/grpc.types.js';
import { COMMENT_TEMPLATES, POST_TEMPLATES } from '../constants/seed-templates.constant.js';
import { MediaSeedService } from './media-seed.service.js';
import type { SeedStatusResponseDTO } from '../common/index.js';

@Injectable()
export class PostSeedService implements OnModuleInit {
  private readonly logger = new Logger({ context: PostSeedService.name });
  private postService!: WithMetadata<PostServiceClient>;
  private publicationService!: WithMetadata<PublicationCommandServiceClient>;
  private interactionService!: WithMetadata<InteractionCommandServiceClient>;

  constructor(
    @Inject(POST_PACKAGE) private readonly postClient: ClientGrpc,
    @Inject(SOCIAL_PACKAGE) private readonly socialClient: ClientGrpc,
    private readonly mediaSeedService: MediaSeedService,
  ) {}

  onModuleInit() {
    this.postService = this.postClient.getService<PostServiceClient>(POST_SERVICE_NAME);
    this.publicationService = this.socialClient.getService<PublicationCommandServiceClient>(
      PUBLICATION_COMMAND_SERVICE_NAME,
    );
    this.interactionService = this.socialClient.getService<InteractionCommandServiceClient>(
      INTERACTION_COMMAND_SERVICE_NAME,
    );
  }

  /**
   * Crée des posts liés aux événements avec photos réelles, commentaires et likes.
   */
  async seedPostsAndInteractions(
    userIds: string[],
    allEventIds: string[],
    pastEventIds: string[],
    targetPostCount: number,
    concurrency: number,
    seedMedia: boolean,
    getMetadata: (base: Metadata, userId: string) => Promise<Metadata>,
    baseMetadata: Metadata,
    status: SeedStatusResponseDTO,
  ): Promise<string[]> {
    this.logger.log(
      `📝 Seeding ${String(targetPostCount)} posts with images, comments and likes...`,
    );

    const allPostIds: string[] = [];

    const createSinglePost = async (index: number) => {
      try {
        const authorId = faker.helpers.arrayElement(userIds);
        const authorMd = await getMetadata(baseMetadata, authorId);

        // 80% des posts sont liés à un événement (en priorité les événements passés récents)
        let relatedEventId: string | undefined;
        if (allEventIds.length > 0 && Math.random() < 0.8) {
          relatedEventId =
            pastEventIds.length > 0 && Math.random() < 0.7
              ? faker.helpers.arrayElement(pastEventIds)
              : faker.helpers.arrayElement(allEventIds);
        }

        const template = faker.helpers.arrayElement(POST_TEMPLATES);
        const title = `${template.title} #${String(index + 1)}`;
        const content = `${template.content} ${faker.lorem.paragraph()}`;

        // 1 Image Unique pour chaque post si activé
        const fileIds: string[] = [];
        if (seedMedia) {
          const tempPostId = randomUUID();
          const fileId = await this.mediaSeedService.getOrUploadImage(
            tempPostId,
            EntityType.ENTITY_TYPE_POST,
            'post',
            authorMd,
          );
          if (fileId) {
            fileIds.push(fileId);
          }
        }

        const res = await lastValueFrom(
          this.postService.createPost(
            {
              title,
              content,
              eventId: relatedEventId,
              fileIds,
              idempotencyKey: randomUUID(),
            },
            authorMd,
          ),
        );

        if (res.post?.id) {
          const postId = res.post.id;
          allPostIds.push(postId);
          status.posts.success++;

          // Synchronisation du nœud de post dans ms-social
          try {
            await lastValueFrom(this.publicationService.createPostNode({ postId }, authorMd));
            await lastValueFrom(this.publicationService.postUserOwn({ postId }, authorMd));
          } catch {
            // Ignorer si déjà synchronisé via outbox
          }
        } else {
          status.posts.failed++;
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        this.logger.debug(`Failed to seed post ${String(index)}: ${msg}`);
        status.posts.failed++;
      }
    };

    // Création des posts par lots
    let processed = 0;
    while (processed < targetPostCount) {
      const currentBatch = Math.min(concurrency, targetPostCount - processed);
      const batchIndices = Array.from({ length: currentBatch }).map((_, i) => processed + i);
      await Promise.all(batchIndices.map((idx) => createSinglePost(idx)));
      processed += currentBatch;
      if (allPostIds.length % 50 === 0 || allPostIds.length === targetPostCount) {
        this.logger.log(
          `Posts progress: ${String(allPostIds.length)}/${String(targetPostCount)} created.`,
        );
      }
    }

    this.logger.log(
      `Posts created: ${String(allPostIds.length)}. Now seeding comments and likes...`,
    );

    if (allPostIds.length === 0) {
      return allPostIds;
    }

    // 2. Commentaires sur les posts (~1.5 commentaire par post)
    const commentCount = Math.floor(allPostIds.length * 1.5);
    const commentItems = Array.from({ length: commentCount }).map(() => ({
      postId: faker.helpers.arrayElement(allPostIds),
      authorId: faker.helpers.arrayElement(userIds),
      content: faker.helpers.arrayElement(COMMENT_TEMPLATES),
    }));

    await this.runChunked(
      commentItems,
      concurrency,
      async (item) => {
        try {
          const authorMd = await getMetadata(baseMetadata, item.authorId);
          const res = await lastValueFrom(
            this.postService.createComment(
              {
                postId: item.postId,
                content: item.content,
              },
              authorMd,
            ),
          );
          if (res.comment?.id) {
            status.comments.success++;
          } else {
            status.comments.failed++;
          }
        } catch {
          status.comments.failed++;
        }
      },
      'Comments',
    );

    // 3. Likes sur les posts (~4 likes par post)
    const likeTarget = Math.floor(allPostIds.length * 4);
    const seenLikes = new Set<string>();
    const likeItems: Array<{ userId: string; postId: string }> = [];

    for (let i = 0; i < likeTarget; i++) {
      const userId = faker.helpers.arrayElement(userIds);
      const postId = faker.helpers.arrayElement(allPostIds);
      const key = `${userId}:${postId}`;
      if (!seenLikes.has(key)) {
        seenLikes.add(key);
        likeItems.push({ userId, postId });
      }
    }

    await this.runChunked(
      likeItems,
      concurrency,
      async (item) => {
        try {
          const userMd = await getMetadata(baseMetadata, item.userId);
          await lastValueFrom(
            this.interactionService.postLikePost(
              {
                postId: item.postId,
              },
              userMd,
            ),
          );
          status.likes.success++;
        } catch {
          status.likes.failed++;
        }
      },
      'Likes',
    );

    return allPostIds;
  }

  private async runChunked<T>(
    items: T[],
    chunkSize: number,
    processor: (item: T) => Promise<void>,
    label: string,
  ): Promise<void> {
    let index = 0;
    while (index < items.length) {
      const batch = items.slice(index, index + chunkSize);
      await Promise.all(batch.map((item) => processor(item)));
      index += chunkSize;
    }
    this.logger.log(`Processed ${String(items.length)} ${label}.`);
  }
}
