import 'reflect-metadata';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { Logger } from '@volontariapp/logger';
import {
  seedEvents,
  seedParticipations,
  seedWishes,
} from './seed/events.seeder.js';
import { seedUsers, seedFollows } from './seed/users.seeder.js';
import { seedPosts } from './seed/posts.seeder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = new Logger({ context: 'MainSeeder' });

// Seeding configuration
const USER_COUNT = 15;
const EVENT_COUNT = 20;
const POSTS_PER_USER = 3;
const PROBABILITIES = {
  follow: 0.3,
  participation: 0.3,
  wish: 0.4,
  like: 0.4,
};

async function main() {
  logger.log('🚀 Initializing global seeding process...');

  try {
    const dataPath = join(__dirname, '../utils/seed-data.json');
    const data = JSON.parse(readFileSync(dataPath, 'utf8'));

    const userIds = await seedUsers(USER_COUNT);
    await seedFollows(userIds, PROBABILITIES.follow);

    const eventIds = await seedEvents(userIds, data.events, EVENT_COUNT);

    // 3. Interactions (Participations & Wishes)
    await seedWishes(userIds, eventIds, PROBABILITIES.wish);
    await seedParticipations(userIds, eventIds, PROBABILITIES.participation);

    // 4. Content (Posts & Likes)
    await seedPosts(userIds, eventIds, POSTS_PER_USER, PROBABILITIES.like);

    logger.log('✅ Global seeding completed successfully!');
  } catch (error: any) {
    logger.error(`💥 Fatal error during seeding: ${error.message}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
