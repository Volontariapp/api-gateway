import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Logger } from '@volontariapp/logger';
import { lastValueFrom } from 'rxjs';
import type { Metadata } from '@grpc/grpc-js';
import {
  TAG_COMMAND_SERVICE_NAME,
  type TagCommandServiceClient,
  TAG_QUERY_SERVICE_NAME,
  type TagQueryServiceClient,
} from '@volontariapp/contracts-nest';
import { TagsNames } from '@volontariapp/shared';
import { EVENT_PACKAGE } from '../../../grpc/grpc-packages.js';
import type { WithMetadata } from '../../../common/types/grpc.types.js';

export interface TagDefinition {
  slug: string;
  name: string;
  balise: string;
}

export const OFFICIAL_TAGS: TagDefinition[] = [
  { slug: 'ecologie', name: 'Écologie', balise: TagsNames.ECOLOGIE.toString() },
  { slug: 'solidarite', name: 'Solidarité', balise: TagsNames.SOCIAL.toString() },
  { slug: 'maraude', name: 'Maraude', balise: TagsNames.SOCIAL.toString() },
  { slug: 'nature', name: 'Nature & Biodiversité', balise: TagsNames.ECOLOGIE.toString() },
  { slug: 'animaux', name: 'Protection Animale', balise: TagsNames.SOCIAL.toString() },
  { slug: 'soutien-scolaire', name: 'Soutien Scolaire', balise: TagsNames.SOCIAL.toString() },
  { slug: 'recyclage', name: 'Recyclage & Zéro Déchet', balise: TagsNames.ECOLOGIE.toString() },
  {
    slug: 'vegetalisation',
    name: 'Végétalisation & Arbres',
    balise: TagsNames.ECOLOGIE.toString(),
  },
  { slug: 'velo', name: 'Atelier Vélo Solidaire', balise: TagsNames.ECOLOGIE.toString() },
  { slug: 'seniors', name: 'Aide aux Séniors', balise: TagsNames.SOCIAL.toString() },
  { slug: 'jeunesse', name: 'Jeunesse & Culture', balise: TagsNames.SOCIAL.toString() },
  { slug: 'climat', name: 'Action Climat', balise: TagsNames.ECOLOGIE.toString() },
];

@Injectable()
export class TagSeedService implements OnModuleInit {
  private readonly logger = new Logger({ context: TagSeedService.name });
  private tagCommandService!: WithMetadata<TagCommandServiceClient>;
  private tagQueryService!: WithMetadata<TagQueryServiceClient>;
  private tagCache = new Map<string, string>(); // slug -> tagId

  constructor(@Inject(EVENT_PACKAGE) private readonly eventClient: ClientGrpc) {}

  onModuleInit() {
    this.tagCommandService =
      this.eventClient.getService<TagCommandServiceClient>(TAG_COMMAND_SERVICE_NAME);
    this.tagQueryService =
      this.eventClient.getService<TagQueryServiceClient>(TAG_QUERY_SERVICE_NAME);
  }

  /**
   * Assure la création de tous les tags officiels et renvoie la cartographie slug -> tagId.
   */
  async ensureTags(md: Metadata): Promise<Map<string, string>> {
    this.logger.log('🏷️ Ensuring official tags in ms-event...');

    // 1. Récupérer les tags existants
    try {
      const res = await lastValueFrom(
        this.tagQueryService.getTags({ slugs: OFFICIAL_TAGS.map((t) => t.slug) }, md),
      );
      for (const t of res.tags) {
        if (t.id && t.slug) {
          this.tagCache.set(t.slug, t.id);
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`Could not fetch existing tags: ${msg}`);
    }

    // 2. Créer les tags manquants
    for (const def of OFFICIAL_TAGS) {
      if (this.tagCache.has(def.slug)) {
        continue;
      }
      try {
        const createRes = await lastValueFrom(
          this.tagCommandService.createTag(
            {
              slug: def.slug,
              name: def.name,
              balise: def.balise,
            },
            md,
          ),
        );
        if (createRes.tag?.id) {
          this.tagCache.set(def.slug, createRes.tag.id);
          this.logger.log(`Created tag "${def.name}" (${def.slug}) -> ${createRes.tag.id}`);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        this.logger.debug(`Tag ${def.slug} creation notice: ${msg}`);
      }
    }

    this.logger.log(`✅ Tags ready: ${String(this.tagCache.size)} available`);
    return this.tagCache;
  }

  getTagId(slug: string): string | undefined {
    return this.tagCache.get(slug);
  }

  getAllTagIds(): string[] {
    return Array.from(this.tagCache.values());
  }
}
