/**
 * Social Network Data Seeder
 * Simulates a populated social graph by calling API Gateway endpoints.
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api/v1';
const USER_COUNT = 15;
const POSTS_PER_USER = 3;
const EVENT_COUNT = 5;
const LIKES_PROBABILITY = 0.4;
const FOLLOW_PROBABILITY = 0.3;
const PARTICIPATION_PROBABILITY = 0.5;

async function seed() {
  console.log('🚀 Starting Social Seeding...');
  console.log(`📍 Targeting: ${API_BASE_URL}`);

  const userIds = Array.from({ length: USER_COUNT }, () => crypto.randomUUID());
  
  // 1. Create Users
  console.log(`👤 Creating ${USER_COUNT} users...`);
  for (const userId of userIds) {
    await fetch(`${API_BASE_URL}/social/users/${userId}`, { method: 'POST' });
  }

  // 2. Create Relationships (Follows)
  console.log('🤝 Establishing relationships...');
  for (const followerId of userIds) {
    for (const followedId of userIds) {
      if (followerId !== followedId && Math.random() < FOLLOW_PROBABILITY) {
        await fetch(`${API_BASE_URL}/social/users/${followerId}/follow/${followedId}`, { method: 'POST' });
      }
    }
  }

  // 3. Create Events
  console.log(`📅 Creating ${EVENT_COUNT} events...`);
  const eventIds: string[] = [];
  for (let i = 0; i < EVENT_COUNT; i++) {
    const eventId = crypto.randomUUID();
    const ownerId = userIds[Math.floor(Math.random() * userIds.length)];
    
    // Create event node
    await fetch(`${API_BASE_URL}/social/events/${eventId}`, { method: 'POST' });
    // Link owner
    await fetch(`${API_BASE_URL}/social/users/${ownerId}/events/${eventId}/own`, { method: 'POST' });
    
    eventIds.push(eventId);
  }

  // 4. Create Participations
  console.log('🙌 Generating participations...');
  for (const userId of userIds) {
    for (const eventId of eventIds) {
      if (Math.random() < PARTICIPATION_PROBABILITY) {
        await fetch(`${API_BASE_URL}/social/users/${userId}/events/${eventId}/participate`, { method: 'POST' });
      }
    }
  }

  // 5. Create Posts & Link to Events
  console.log('📝 Creating publications...');
  const postIds: string[] = [];
  for (const userId of userIds) {
    for (let i = 0; i < POSTS_PER_USER; i++) {
      const postId = crypto.randomUUID();
      // Create post node
      await fetch(`${API_BASE_URL}/social/posts/${postId}`, { method: 'POST' });
      // Link to user
      await fetch(`${API_BASE_URL}/social/users/${userId}/posts/${postId}/own`, { method: 'POST' });
      
      // Randomly link post to an event (50% chance)
      if (Math.random() < 0.5) {
        const randomEventId = eventIds[Math.floor(Math.random() * eventIds.length)];
        await fetch(`${API_BASE_URL}/social/events/${randomEventId}/posts/${postId}`, { method: 'POST' });
      }
      
      postIds.push(postId);
    }
  }

  // 6. Create Interactions (Likes)
  console.log('❤️ Simulating interactions...');
  for (const userId of userIds) {
    for (const postId of postIds) {
      if (Math.random() < LIKES_PROBABILITY) {
        await fetch(`${API_BASE_URL}/social/users/${userId}/likes/${postId}`, { method: 'POST' });
      }
    }
  }

  console.log('✅ Seeding completed! Your social graph (including events) is now populated.');
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
