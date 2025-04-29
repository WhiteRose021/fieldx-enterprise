// services/core/redis.ts
import Redis from "ioredis";

export interface RedisConfig {
  host?: string;
  port?: number;
  password?: string;
  keyPrefix?: string;
}

// Default TTL for cached items (in seconds)
const DEFAULT_CACHE_TTL = 300; // 5 minutes

export class RedisService {
  private client: Redis;
  private static instance: RedisService;

  // Singleton pattern
  public static getInstance(config?: RedisConfig): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService(config);
    }
    return RedisService.instance;
  }

  private constructor(config?: RedisConfig) {
    console.log("🧪 RedisService started with config:", {
      host: config?.host || process.env.REDIS_HOST,
      port: config?.port || process.env.REDIS_PORT,
      password: config?.password || process.env.REDIS_PASSWORD,
    });
  
    this.client = new Redis({
      host: config?.host || process.env.REDIS_HOST || "localhost",
      port: config?.port || parseInt(process.env.REDIS_PORT || "6379"),
      password: config?.password || process.env.REDIS_PASSWORD,
      keyPrefix: config?.keyPrefix || `fieldx:${process.env.NODE_ENV || "development"}:`,
    });
  
    this.client.on("error", (err) => {
      console.error("Redis error:", err);
    });
  }
  
  // Get a value from cache
  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    if (!data) return null;
    
    try {
      return JSON.parse(data) as T;
    } catch (e) {
      console.error("Failed to parse Redis data:", e);
      return null;
    }
  }

  // Set a value in cache with optional TTL
  async set(key: string, value: any, ttlSeconds = DEFAULT_CACHE_TTL): Promise<void> {
    await this.client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  }

  // Delete a value from cache
  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  // Clear cache by pattern
  async clearPattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(`${this.client.options.keyPrefix}${pattern}`);
    if (keys.length > 0) {
      // Remove the prefix from keys before deleting
      const keysWithoutPrefix = keys.map(key => 
        key.substring((this.client.options.keyPrefix as string).length)
      );
      await this.client.del(...keysWithoutPrefix);
    }
  }

  // Store session data
  async setSession(sessionId: string, data: any, ttlSeconds = 86400): Promise<void> {
    await this.set(`session:${sessionId}`, data, ttlSeconds);
  }

  // Get session data
  async getSession<T>(sessionId: string): Promise<T | null> {
    return this.get<T>(`session:${sessionId}`);
  }

  // Delete session
  async deleteSession(sessionId: string): Promise<void> {
    await this.delete(`session:${sessionId}`);
  }

  // Set rate limit counter
  async incrementRateLimit(key: string, ttlSeconds = 60): Promise<number> {
    const result = await this.client.incr(`ratelimit:${key}`);
    // Set expiry if this is the first increment
    if (result === 1) {
      await this.client.expire(`ratelimit:${key}`, ttlSeconds);
    }
    return result;
  }

  // Close Redis connection
  async close(): Promise<void> {
    await this.client.quit();
  }

  async getAllKeys(): Promise<string[]> {
    return this.client.keys("*");
  }
}