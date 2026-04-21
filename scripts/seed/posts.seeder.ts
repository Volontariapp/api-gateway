import { Logger } from '@volontariapp/logger';
import { post } from './api.js';

const logger = new Logger({ context: 'PostSeeder' });

export async function seedPosts(
  userIds: string[],
  eventIds: string[],
  postsPerUser: number,
  likesProb: number,
) {
  logger.log('📝 Seeding posts...');
  const postIds: string[] = [];

  for (const userId of userIds) {
    for (let i = 0; i < postsPerUser; i++) {
      try {
        const postId = crypto.randomUUID();
        await post(`/social/posts/${postId}`);
        await post(`/social/users/${userId}/posts/${postId}/own`);

        if (eventIds.length > 0 && Math.random() < 0.5) {
          const eventId = eventIds[Math.floor(Math.random() * eventIds.length)];
          await post(`/social/events/${eventId}/posts/${postId}`);
        }
        postIds.push(postId);
      } catch (e) {}
    }
  }

  logger.log('❤️ Seeding likes...');
  let likeCount = 0;
  for (const userId of userIds) {
    for (const postId of postIds) {
      if (Math.random() < likesProb) {
        try {
          await post(`/social/users/${userId}/likes/${postId}`);
          likeCount++;
        } catch (e) {}
      }
    }
  }
  logger.log(`✅ Created ${likeCount} likes.`);
}
