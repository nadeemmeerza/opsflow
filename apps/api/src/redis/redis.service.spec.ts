
import { ConfigService } from '@nestjs/config';
import { vi } from 'vitest';

import { Redis } from 'ioredis';

import { RedisService } from './redis.service.js';

/**
 * Vitest hoists vi.mock() calls.
 *
 * Everything required by the mocked Redis constructor therefore needs
 * to exist inside vi.hoisted().
 */
const { MockRedis, mockRedisClient } = vi.hoisted(() => {
  const client = {
    get: vi.fn(),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    quit: vi.fn().mockResolvedValue('OK'),
    on: vi.fn().mockReturnThis(),
  };

  /**
   * RedisService uses:
   *
   *   new Redis(...)
   *
   * Therefore the mock must be constructable.
   *
   * The implementation returns our shared mock client so every
   * RedisService instance uses the same controllable test client.
   */
  const RedisConstructor = vi.fn(function () {
    return client;
  });

  return {
    MockRedis: RedisConstructor,
    mockRedisClient: client,
  };
});

vi.mock('ioredis', () => ({
  Redis: MockRedis,
}));

describe('RedisService', () => {
  let service: RedisService;

  let configService: {
    getOrThrow: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    /*
     * Restore the default successful Redis behaviour before every test.
     * Individual tests can override these methods when testing failures.
     */
    mockRedisClient.get.mockReset();
    mockRedisClient.set.mockReset();
    mockRedisClient.del.mockReset();
    mockRedisClient.quit.mockReset();
    mockRedisClient.on.mockReset();

    mockRedisClient.set.mockResolvedValue('OK');
    mockRedisClient.del.mockResolvedValue(1);
    mockRedisClient.quit.mockResolvedValue('OK');
    mockRedisClient.on.mockReturnThis();

    configService = {
      getOrThrow: vi.fn((key: string) => {
        if (key === 'REDIS_HOST') {
          return 'localhost';
        }

        if (key === 'REDIS_PORT') {
          return '6379';
        }

        throw new Error(`Unknown config key: ${key}`);
      }),
    };

    service = new RedisService(
      configService as unknown as ConfigService,
    );
  });

  describe('constructor', () => {
    it('should create the Redis client using configuration', () => {
      expect(Redis).toHaveBeenCalledWith({
        host: 'localhost',
        port: 6379,
      });
    });

    it('should register Redis connection event handlers', () => {
      expect(mockRedisClient.on).toHaveBeenCalledWith(
        'connect',
        expect.any(Function),
      );

      expect(mockRedisClient.on).toHaveBeenCalledWith(
        'error',
        expect.any(Function),
      );
    });
  });

  describe('get', () => {
    it('should return a cached value', async () => {
      mockRedisClient.get.mockResolvedValue(
        JSON.stringify({
          id: 'project-123',
          name: 'OpsFlow',
        }),
      );

      const result = await service.get<{
        id: string;
        name: string;
      }>('project:project-123');

      expect(result).toEqual({
        id: 'project-123',
        name: 'OpsFlow',
      });

      expect(mockRedisClient.get).toHaveBeenCalledWith(
        'project:project-123',
      );
    });

    it('should return null when the key does not exist', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result =
        await service.get('project:missing');

      expect(result).toBeNull();
    });

    it('should fail open when Redis throws an error', async () => {
      mockRedisClient.get.mockRejectedValue(
        new Error('Redis unavailable'),
      );

      const result =
        await service.get('project:123');

      expect(result).toBeNull();
    });

    it('should return null when cached JSON is invalid', async () => {
      mockRedisClient.get.mockResolvedValue(
        'invalid-json',
      );

      const result =
        await service.get('project:123');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should store a JSON value without TTL', async () => {
      const value = {
        id: 'project-123',
        name: 'OpsFlow',
      };

      await service.set(
        'project:project-123',
        value,
      );

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'project:project-123',
        JSON.stringify(value),
      );
    });

    it('should store a JSON value with TTL', async () => {
      const value = {
        id: 'project-123',
        name: 'OpsFlow',
      };

      await service.set(
        'project:project-123',
        value,
        60,
      );

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'project:project-123',
        JSON.stringify(value),
        'EX',
        60,
      );
    });

    it('should fail open when Redis cannot store the value', async () => {
      mockRedisClient.set.mockRejectedValue(
        new Error('Redis unavailable'),
      );

      await expect(
        service.set(
          'project:project-123',
          {
            id: 'project-123',
          },
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('delete', () => {
    it('should delete a cache key', async () => {
      await service.delete(
        'project:project-123',
      );

      expect(mockRedisClient.del).toHaveBeenCalledWith(
        'project:project-123',
      );
    });

    it('should fail open when Redis cannot delete the key', async () => {
      mockRedisClient.del.mockRejectedValue(
        new Error('Redis unavailable'),
      );

      await expect(
        service.delete(
          'project:project-123',
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('onModuleDestroy', () => {
    it('should gracefully close the Redis connection', async () => {
      await service.onModuleDestroy();

      expect(mockRedisClient.quit).toHaveBeenCalled();
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
