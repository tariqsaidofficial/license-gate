import { createClient } from 'redis';

class RedisManager {
  private client;
  private isConnected = false;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.log('Redis max retries reached. Falling back to memory storage.');
            return false;
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    this.client.on('error', (err) => {
      console.log('Redis Client Error', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('✅ Redis connected');
      this.isConnected = true;
    });
  }

  async connect() {
    try {
      await this.client.connect();
    } catch (error) {
      console.warn('⚠️ Redis connection failed, using memory fallback');
      this.isConnected = false;
    }
  }

  async setRefreshToken(userId: number, token: string, expiryDays = 30) {
    if (!this.isConnected) {
      // Fallback to database if Redis is unavailable
      return this.setRefreshTokenFallback(userId, token);
    }

    try {
      const key = `refresh:${userId}`;
      await this.client.setEx(key, 60 * 60 * 24 * expiryDays, token);
      return true;
    } catch (error) {
      console.error('Redis setRefreshToken error:', error);
      return this.setRefreshTokenFallback(userId, token);
    }
  }

  async getRefreshToken(userId: number): Promise<string | null> {
    if (!this.isConnected) {
      return this.getRefreshTokenFallback(userId);
    }

    try {
      const key = `refresh:${userId}`;
      const token = await this.client.get(key);
      return token;
    } catch (error) {
      console.error('Redis getRefreshToken error:', error);
      return this.getRefreshTokenFallback(userId);
    }
  }

  async deleteRefreshToken(userId: number) {
    if (!this.isConnected) {
      return this.deleteRefreshTokenFallback(userId);
    }

    try {
      const key = `refresh:${userId}`;
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis deleteRefreshToken error:', error);
      return this.deleteRefreshTokenFallback(userId);
    }
  }

  // Fallback methods using Prisma when Redis is unavailable
  private async setRefreshTokenFallback(userId: number, token: string) {
    const { prisma } = await import('../prisma');
    await prisma.user.update({
      where: { id: userId },
      data: { refreshSession: token }
    });
    return true;
  }

  private async getRefreshTokenFallback(userId: number): Promise<string | null> {
    const { prisma } = await import('../prisma');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { refreshSession: true }
    });
    return user?.refreshSession || null;
  }

  private async deleteRefreshTokenFallback(userId: number) {
    const { prisma } = await import('../prisma');
    await prisma.user.update({
      where: { id: userId },
      data: { refreshSession: null }
    });
    return true;
  }

  async disconnect() {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }
}

export const redisManager = new RedisManager();
