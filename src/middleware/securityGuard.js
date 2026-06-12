import redisClient from '../config/redis.js';

export const registrationSecurityGuard = async (req, res, next) => {
  const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const securityKey = `security:register:block:${clientIp}`;
  
  try {
    const isBlacklisted = await redisClient.get(`blacklist:${clientIp}`);
    if (isBlacklisted) {
      return res.status(403).json({
        success: false,
        message: '🚨 SECURITY NOTICE: Access Denied. Your IP address has been temporarily blacklisted due to malicious token generation behavior.'
      });
    }

    const requestCount = await redisClient.incr(securityKey);
    
    if (requestCount === 1) {
      await redisClient.expire(securityKey, 600);
    }

    if (requestCount > 5) {
      await redisClient.set(`blacklist:${clientIp}`, 'BLOCKED', 'EX', 3600);
      await redisClient.del(securityKey);
      
      console.warn(`🚨 SECURITY BREACH: IP Address ${clientIp} blocked for generating excessive identity pairs.`);
      
      return res.status(403).json({
        success: false,
        message: '🚨 SECURITY NOTICE: Access Denied. Your IP address has been temporarily blacklisted due to malicious token generation behavior.'
      });
    }

    next();
  } catch (error) {
    console.error('Security Interceptor Pipeline Error:', error);
    next();
  }
};