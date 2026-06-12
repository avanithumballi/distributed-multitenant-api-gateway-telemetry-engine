import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redisClient = createClient({
  url: redisUrl
});

redisClient.on('connect', () => console.log('🏎️ Connected to Redis Cache Engine.'));
redisClient.on('error', (err) => console.error('🚨 Redis Connection Error:', err));

await redisClient.connect();
export default redisClient;