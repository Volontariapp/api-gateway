import { Logger } from '@volontariapp/logger';
import { post } from './api.js';

const logger = new Logger({ context: 'UserSeeder' });

export async function seedUsers(count: number): Promise<string[]> {
  logger.log(`👤 Seeding ${count} users...`);
  const userIds: string[] = [];
  for (let i = 0; i < count; i++) {
    try {
      const userId = crypto.randomUUID();
      await post(`/social/users/${userId}`);
      userIds.push(userId);
    } catch (e: any) {
      logger.error(`❌ Failed to seed user ${i}: ${e.message}`);
    }
  }
  return userIds;
}

export async function seedFollows(userIds: string[], probability: number) {
  logger.log('🤝 Seeding follows...');
  for (const followerId of userIds) {
    for (const followedId of userIds) {
      if (followerId !== followedId && Math.random() < probability) {
        try {
          await post(`/social/users/${followerId}/follow/${followedId}`);
        } catch (e) {}
      }
    }
  }
}
