import { Logger } from '@volontariapp/logger';
import {
  type CreateEventRequest,
  type EventWebResponse,
  Tag,
} from '@volontariapp/contracts';
import { get, post } from './api.js';

import { TagsNames } from '@volontariapp/shared';

const logger = new Logger({ context: 'EventSeeder' });

export async function seedEvents(
  userIds: string[],
  eventData: any[],
  count: number,
): Promise<string[]> {
  logger.log(`🏷️ Seeding tags...`);
  const tagMap = new Map<string, string>();
  const uniqueTags = Array.from(
    new Set(eventData.flatMap((e) => e.tags || [])),
  );

  for (const label of uniqueTags) {
    const slug = label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const balise =
      label.toLowerCase().includes('écolo') ||
      label.toLowerCase().includes('nature')
        ? TagsNames.ECOLOGIE.toString()
        : TagsNames.SOCIAL.toString();

    try {
      const { tag } = await post<{ tag: { id: string } }>('/tags', {
        slug,
        name: label,
        balise,
      });
      tagMap.set(label, tag.id);
    } catch (e: any) {
      try {
        const { tags } = await get<{ tags: Tag[] }>('/tags');
        const existing = tags.find((t: Tag) => t.slug === slug);
        if (existing) tagMap.set(label, existing.id);
      } catch (inner) {}
    }
  }

  logger.log(`📅 Seeding ${count} events...`);
  const eventIds: string[] = [];

  for (let i = 0; i < count; i++) {
    const ownerId = userIds[i % userIds.length];
    const dataSample = eventData[i % eventData.length];

    const tagIds = (dataSample.tags || [])
      .map((label: string) => tagMap.get(label))
      .filter(Boolean) as string[];

    const eventPayload: CreateEventRequest = {
      title: dataSample.title,
      description: dataSample.description,
      startAt: new Date(Date.now() + 86400000 * (i + 1)),
      endAt: new Date(Date.now() + 86400000 * (i + 1) + 3600000 * 2),
      localisationName: dataSample.localisationName,
      type: dataSample.type,
      awardedImpactScore: dataSample.awardedImpactScore,
      maxParticipants: dataSample.maxParticipants,
      tagIds,
    };

    try {
      const { event } = await post<EventWebResponse>('/events', eventPayload);
      const eventId = event.id;

      await post(`/social/events/${eventId}`);
      await post(`/social/users/${ownerId}/events/${eventId}/own`);

      if (dataSample.requirements) {
        for (const reqName of dataSample.requirements) {
          try {
            await post(`/events/${eventId}/requirements`, {
              name: reqName,
              description: `Pré-requis : ${reqName}`,
              neededQuantity: 10,
            });
          } catch (e) {}
        }
      }

      eventIds.push(eventId);
      logger.log(`✅ Event "${event.title}" created with tags & requirements.`);
    } catch (e: any) {
      logger.error(`❌ Failed to seed event ${i}: ${e.message}`);
    }
  }
  return eventIds;
}

export async function seedWishes(
  userIds: string[],
  eventIds: string[],
  probability: number,
) {
  logger.log('✨ Seeding event wishes...');
  let wishCount = 0;
  for (const userId of userIds) {
    for (const eventId of eventIds) {
      if (Math.random() < probability) {
        try {
          await post(`/social/users/${userId}/events/${eventId}/wish`);
          wishCount++;
        } catch (e) {}
      }
    }
  }
  logger.log(`✅ Created ${wishCount} wishes.`);
}

export async function seedParticipations(
  userIds: string[],
  eventIds: string[],
  probability: number,
) {
  logger.log('🙌 Seeding participations...');
  let partCount = 0;
  for (const userId of userIds) {
    for (const eventId of eventIds) {
      if (Math.random() < probability) {
        try {
          await post(`/social/users/${userId}/events/${eventId}/participate`);
          partCount++;
        } catch (e) {}
      }
    }
  }
  logger.log(`✅ Created ${partCount} participations.`);
}
