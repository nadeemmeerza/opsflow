import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';

import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { PasswordService } from './password/password.service.js';

describe('AuthService', () => {
  let authService: AuthService;

  const usersServiceMock = {
    findByEmailWithoutPassword: vi.fn(),
    findByEmail: vi.fn(),
    create: vi.fn(),
  };

  const passwordServiceMock = {
    hash: vi.fn(),
    verify: vi.fn(),
  };

  const jwtServiceMock = {
    signAsync: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
        {
          provide: PasswordService,
          useValue: passwordServiceMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const user = {
        _id: 'user-id',
        name: 'Nadeem Abbas',
        email: 'nadeem@example.com',
        status: 'active',
        createdAt: new Date('2026-01-01'),
      };

      usersServiceMock.findByEmailWithoutPassword.mockResolvedValue(null);

      passwordServiceMock.hash.mockResolvedValue('hashed-password');

      usersServiceMock.create.mockResolvedValue({
        ...user,
        passwordHash: 'hashed-password',
      });

      const result = await authService.register({
        name: ' Nadeem Abbas ',
        email: ' Nadeem@Example.com ',
        password: 'Password@123',
      });

      expect(
        usersServiceMock.findByEmailWithoutPassword,
      ).toHaveBeenCalledWith('nadeem@example.com');

      expect(passwordServiceMock.hash).toHaveBeenCalledWith(
        'Password@123',
      );

      expect(usersServiceMock.create).toHaveBeenCalledWith({
        name: 'Nadeem Abbas',
        email: 'nadeem@example.com',
        passwordHash: 'hashed-password',
      });

      expect(result).toEqual({
        id: 'user-id',
        name: 'Nadeem Abbas',
        email: 'nadeem@example.com',
        status: 'active',
        createdAt: user.createdAt,
      });
    });

    it('should reject registration when email already exists', async () => {
      usersServiceMock.findByEmailWithoutPassword.mockResolvedValue({
        _id: 'existing-user',
        email: 'nadeem@example.com',
      });

      await expect(
        authService.register({
          name: 'Nadeem Abbas',
          email: 'Nadeem@example.com',
          password: 'Password@123',
        }),
      ).rejects.toThrow(
        new ConflictException(
          'A user with this email already exists',
        ),
      );

      expect(passwordServiceMock.hash).not.toHaveBeenCalled();

      expect(usersServiceMock.create).not.toHaveBeenCalled();
    });
  });

  describe('validateCredentials', () => {
    it('should reject login when user does not exist', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(null);

      await expect(
        authService.validateCredentials(
          'nadeem@example.com',
          'Password@123',
        ),
      ).rejects.toThrow(
        new UnauthorizedException('Invalid email or password'),
      );

      expect(passwordServiceMock.verify).not.toHaveBeenCalled();

      expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
    });

    it('should reject login when password is incorrect', async () => {
      usersServiceMock.findByEmail.mockResolvedValue({
        _id: 'user-id',
        name: 'Nadeem Abbas',
        email: 'nadeem@example.com',
        passwordHash: 'stored-hash',
        status: 'active',
      });

      passwordServiceMock.verify.mockResolvedValue(false);

      await expect(
        authService.validateCredentials(
          'nadeem@example.com',
          'WrongPassword',
        ),
      ).rejects.toThrow(
        new UnauthorizedException('Invalid email or password'),
      );

      expect(passwordServiceMock.verify).toHaveBeenCalledWith(
        'stored-hash',
        'WrongPassword',
      );

      expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
    });

    it('should reject login when user account is not active', async () => {
      usersServiceMock.findByEmail.mockResolvedValue({
        _id: 'user-id',
        name: 'Nadeem Abbas',
        email: 'nadeem@example.com',
        passwordHash: 'stored-hash',
        status: 'suspended',
      });

      passwordServiceMock.verify.mockResolvedValue(true);

      await expect(
        authService.validateCredentials(
          'nadeem@example.com',
          'Password@123',
        ),
      ).rejects.toThrow(
        new UnauthorizedException('User account is not active'),
      );

      expect(passwordServiceMock.verify).toHaveBeenCalledWith(
        'stored-hash',
        'Password@123',
      );

      expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
    });

    it('should authenticate a valid user and return an access token', async () => {
      usersServiceMock.findByEmail.mockResolvedValue({
        _id: 'user-id',
        name: 'Nadeem Abbas',
        email: 'nadeem@example.com',
        passwordHash: 'stored-hash',
        status: 'active',
      });

      passwordServiceMock.verify.mockResolvedValue(true);

      jwtServiceMock.signAsync.mockResolvedValue(
        'jwt-access-token',
      );

      const result = await authService.validateCredentials(
        'nadeem@example.com',
        'Password@123',
      );

      expect(usersServiceMock.findByEmail).toHaveBeenCalledWith(
        'nadeem@example.com',
      );

      expect(passwordServiceMock.verify).toHaveBeenCalledWith(
        'stored-hash',
        'Password@123',
      );

      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
        sub: 'user-id',
        email: 'nadeem@example.com',
      });

      expect(result).toEqual({
        accessToken: 'jwt-access-token',
        user: {
          id: 'user-id',
          name: 'Nadeem Abbas',
          email: 'nadeem@example.com',
          status: 'active',
        },
      });
    });
  });
});