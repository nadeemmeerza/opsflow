import {
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(
    RedisService.name,
  );

  private readonly client: Redis;

  constructor(
    private readonly configService: ConfigService,
  ) {
    const host =
      this.configService.getOrThrow<string>(
        'REDIS_HOST',
      );

    const port = Number(
      this.configService.getOrThrow<string>(
        'REDIS_PORT',
      ),
    );

    if (Number.isNaN(port)) {
      throw new Error(
        'REDIS_PORT must be a valid number',
      );
    }

    this.client = new Redis({
      host,
      port,
    });

    this.client.on('connect', () => {
      this.logger.log(
        `Connected to Redis at ${host}:${port}`,
      );
    });

    this.client.on('error', (error: Error) => {
      this.logger.error(
        'Redis connection error',
        error.stack,
      );
    });
  }

  /**
   * Checks whether Redis is reachable.
   *
   * Unlike normal cache operations, this method does not
   * fail open because its purpose is to report the actual
   * health of the Redis dependency.
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response =
        await this.client.ping();

      return response === 'PONG';
    } catch (error) {
      this.logger.debug(
        error instanceof Error
          ? error.stack
          : String(error),
      );

      return false;
    }
  }

  /**
   * Reads a JSON value from Redis.
   *
   * Redis stores everything as strings, so application
   * objects are serialized/deserialized at this boundary.
   *
   * Cache failures intentionally return null instead of
   * breaking the API request. MongoDB remains the source
   * of truth.
   */
  async get<T>(
    key: string,
  ): Promise<T | null> {
    try {
      const value =
        await this.client.get(key);

      if (value === null) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.warn(
        `Redis GET failed for key "${key}". Falling back to the primary database.`,
      );

      this.logger.debug(
        error instanceof Error
          ? error.stack
          : String(error),
      );

      return null;
    }
  }

  /**
   * Stores a JSON-serializable value in Redis.
   *
   * TTL is optional. Cache entries used by the application
   * should normally have a TTL so stale data cannot live forever.
   */
  async set<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<void> {
    try {
      const serializedValue =
        JSON.stringify(value);

      if (ttlSeconds !== undefined) {
        if (
          !Number.isInteger(ttlSeconds) ||
          ttlSeconds <= 0
        ) {
          throw new Error(
            'Redis TTL must be a positive integer',
          );
        }

        await this.client.set(
          key,
          serializedValue,
          'EX',
          ttlSeconds,
        );

        return;
      }

      await this.client.set(
        key,
        serializedValue,
      );
    } catch (error) {
      this.logger.warn(
        `Redis SET failed for key "${key}". Continuing without cache.`,
      );

      this.logger.debug(
        error instanceof Error
          ? error.stack
          : String(error),
      );
    }
  }

  /**
   * Removes a cache entry.
   *
   * Cache invalidation is best-effort because MongoDB is
   * the authoritative data store.
   */
  async delete(
    key: string,
  ): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.warn(
        `Redis DELETE failed for key "${key}".`,
      );

      this.logger.debug(
        error instanceof Error
          ? error.stack
          : String(error),
      );
    }
  }

  /**
   * Gracefully closes the Redis connection when NestJS
   * shuts down.
   */
  async onModuleDestroy(): Promise<void> {
    try {
      await this.client.quit();
    } catch (error) {
      this.logger.warn(
        'Failed to gracefully close the Redis connection.',
      );

      this.logger.debug(
        error instanceof Error
          ? error.stack
          : String(error),
      );
    }
  }
}