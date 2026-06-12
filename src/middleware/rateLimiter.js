import redisClient from '../config/redis.js';
import { Tenant } from '../models/Tenant.js';
import { analyticsQueue } from '../config/queue.js';
import { gatewayConfig } from '../server.js';

export const rateLimiter = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(401).json({ success: false, message: 'Authentication failed: Missing API Key.' });

  try {
    let tenant = null;
    const cacheKey = `cache:tenant:${apiKey}`;
    const cachedTenant = await redisClient.get(cacheKey);

    if (cachedTenant) {
      tenant = JSON.parse(cachedTenant);
    } else {
      tenant = await Tenant.findOne({ apiKey, isActive: true });
      if (!tenant) return res.status(403).json({ success: false, message: 'Authentication failed: Invalid Key.' });
      await redisClient.set(cacheKey, JSON.stringify(tenant), 'EX', 300);
    }

    const maxLimit = tenant.plan === 'pro' ? gatewayConfig.proLimit : gatewayConfig.freeLimit;
    const tenantIdStr = (tenant._id || tenant.id).toString();
    
    const currentMinuteBucket = Math.floor(Date.now() / 60000);
    const redisKey = `ratelimit:tenant:${tenantIdStr}:${currentMinuteBucket}`;
    
    const currentCount = await redisClient.incr(redisKey);
    if (currentCount === 1) await redisClient.expire(redisKey, 60);

    res.setHeader('X-RateLimit-Limit', maxLimit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxLimit - currentCount));

    const finalHttpStatus = currentCount > maxLimit ? 429 : 200;

    // Fast offload asynchronous task streaming straight to BullMQ queue pipelines
    analyticsQueue.add('logRequest', {
      tenantId: tenantIdStr,
      endpoint: req.originalUrl,
      method: req.method,
      status: finalHttpStatus,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: Date.now()
    }).catch(err => console.error('Queue Logging Error:', err));

    if (currentCount > maxLimit) {
      return res.status(429).json({
        success: false,
        message: `Rate limit tier exceeded for your ${tenant.plan} plan. Gateway policies currently restrict your layout to ${maxLimit} requests per minute!`,
        retryAfterSeconds: 60
      });
    }

    next();
  } catch (error) {
    console.error('Multi-Tenant Rate Limiter Critical Error:', error);
    next();
  }
};