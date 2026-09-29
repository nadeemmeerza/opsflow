import { beforeEach, describe, expect, it, vi } from 'vitest';

const argon2Mock = vi.hoisted(() => ({
  hash: vi.fn(),
  verify: vi.fn(),
  argon2id: 'argon2id',
}));

vi.mock('argon2', () => argon2Mock);

import { PasswordService } from './password.service.js';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(() => {
    vi.clearAllMocks();

    service = new PasswordService();
  });

  describe('hash', () => {
    it('should hash a password using Argon2id', async () => {
      argon2Mock.hash.mockResolvedValue(
        '$argon2id$v=19$m=65536,t=3,p=4$mockhash',
      );

      const result = await service.hash(
        'MySecurePassword123!',
      );

      expect(argon2Mock.hash).toHaveBeenCalledWith(
        'MySecurePassword123!',
        {
          type: 'argon2id',
        },
      );

      expect(result).toBe(
        '$argon2id$v=19$m=65536,t=3,p=4$mockhash',
      );
    });

    it('should propagate errors from Argon2', async () => {
      const error = new Error(
        'Argon2 hashing failed',
      );

      argon2Mock.hash.mockRejectedValue(error);

      await expect(
        service.hash('password'),
      ).rejects.toThrow(
        'Argon2 hashing failed',
      );

      expect(argon2Mock.hash).toHaveBeenCalledWith(
        'password',
        {
          type: 'argon2id',
        },
      );
    });
  });

  describe('verify', () => {
    it('should return true when the password is correct', async () => {
      argon2Mock.verify.mockResolvedValue(true);

      const result = await service.verify(
        'hashed-password',
        'correct-password',
      );

      expect(argon2Mock.verify).toHaveBeenCalledWith(
        'hashed-password',
        'correct-password',
      );

      expect(result).toBe(true);
    });

    it('should return false when the password is incorrect', async () => {
      argon2Mock.verify.mockResolvedValue(false);

      const result = await service.verify(
        'hashed-password',
        'wrong-password',
      );

      expect(argon2Mock.verify).toHaveBeenCalledWith(
        'hashed-password',
        'wrong-password',
      );

      expect(result).toBe(false);
    });

    it('should propagate errors from Argon2 verification', async () => {
      const error = new Error(
        'Argon2 verification failed',
      );

      argon2Mock.verify.mockRejectedValue(error);

      await expect(
        service.verify(
          'invalid-hash',
          'password',
        ),
      ).rejects.toThrow(
        'Argon2 verification failed',
      );

      expect(argon2Mock.verify).toHaveBeenCalledWith(
        'invalid-hash',
        'password',
      );
    });
  });
});