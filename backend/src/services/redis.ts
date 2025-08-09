import { createClient } from 'redis';

let redisClient: any;

export const initializeRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (err: any) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    await redisClient.connect();
  } catch (error) {
    console.error('❌ Redis initialization failed:', error);
    // Don't throw error, allow app to continue without Redis
  }
};

export const getRedisClient = () => redisClient;

export const setCache = async (key: string, value: any, expireInSeconds = 3600) => {
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.setEx(key, expireInSeconds, JSON.stringify(value));
    }
  } catch (error) {
    console.error('Redis set error:', error);
  }
};

export const getCache = async (key: string) => {
  try {
    if (redisClient && redisClient.isOpen) {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    }
  } catch (error) {
    console.error('Redis get error:', error);
  }
  return null;
};

export const deleteCache = async (key: string) => {
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.del(key);
    }
  } catch (error) {
    console.error('Redis delete error:', error);
  }
};