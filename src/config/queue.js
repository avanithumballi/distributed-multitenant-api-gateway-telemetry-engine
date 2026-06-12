import { Queue, Worker } from 'bullmq';
import dotenv from 'dotenv';
import { UsageLog } from '../models/UsageLog.js';
import { io } from '../server.js';

dotenv.config();

let redisConnection = {};

if (process.env.REDIS_URL) {
  try {
    const url = new URL(process.env.REDIS_URL);
    redisConnection = {
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      password: url.password || undefined,
      username: url.username || undefined,
      tls: url.protocol === 'rediss:' ? {} : undefined
    };
  } catch (e) {
    redisConnection = {
      host: process.env.REDIS_URL.split('@')[1]?.split(':')[0] || 'localhost',
      port: parseInt(process.env.REDIS_URL.split(':')[3]) || 6379,
      password: process.env.REDIS_URL.split(':')[2]?.split('@')[0] || undefined
    };
  }
} else {
  redisConnection = {
    host: '127.0.0.1',
    port: 6379
  };
}

const QUEUE_NAME = 'analytics-logging-queue';
export const analyticsQueue = new Queue(QUEUE_NAME, { connection: redisConnection });

const analyticsWorker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const { tenantId, endpoint, method, status, ipAddress, timestamp } = job.data;
    try {
      const log = new UsageLog({
        tenantId,
        endpoint,
        method,
        status,
        ipAddress,
        timestamp: new Date(timestamp)
      });
      await log.save();

      const statistics = await UsageLog.aggregate([
        { $match: { tenantId: log.tenantId } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);

      let allowedRequests = 0;
      let blockedRequests = 0;

      statistics.forEach(stat => {
        if (stat._id === 200) allowedRequests = stat.count;
        if (stat._id === 429) blockedRequests = stat.count;
      });

      io.emit(`analyticsUpdate:${tenantId}`, {
        allowed: allowedRequests,
        blocked: blockedRequests,
        total: allowedRequests + blockedRequests
      });

    } catch (error) {
      console.error(`Worker failed to process job ${job.id}:`, error);
      throw error;
    }
  },
  { connection: redisConnection }
);

analyticsWorker.on('completed', (job) => {
  console.log(`🎯 Real-Time Event Streamed: Analytics job ${job.id} dispatched via WebSockets.`);
});