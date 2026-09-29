import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';

import { UsersService } from './users.service.js';
import { User } from './schemas/user.schema.js';

type UserModelMock = {
  new (data: unknown): {
    save: ReturnType<typeof vi.fn>;
  };

  findOne: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
};

describe('UsersService', () => {
  let service: UsersService;
  let userModel: UserModelMock;

  beforeEach(async () => {
    /*
     * UsersService uses the Mongoose model in two different ways:
     *
     * 1. As a constructor:
     *      new this.userModel(data)
     *
     * 2. Through static methods:
     *      this.userModel.findOne(...)
     *      this.userModel.findById(...)
     *
     * Therefore the mock must support all three operations.
     */
    const MockUserModel = vi.fn();

    userModel = MockUserModel as unknown as UserModelMock;

    userModel.findOne = vi.fn();
    userModel.findById = vi.fn();

    Object.defineProperty(userModel, 'prototype', {
      value: {
        save: vi.fn(),
      },
      writable: true,
    });

    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: userModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash: 'hashed-password',
      };

      const savedUser = {
        _id: 'user-123',
        ...userData,
      };

      const save = vi.fn().mockResolvedValue(savedUser);

      userModel.prototype.save = save;

      const result = await service.create(userData);

      expect(userModel).toHaveBeenCalledWith(userData);
      expect(save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(savedUser);
    });
  });

  describe('findByEmail', () => {
    it('should find a user by lowercase email and include passwordHash', async () => {
      const user = {
        _id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash: 'hashed-password',
      };

      const exec = vi.fn().mockResolvedValue(user);

      const select = vi.fn().mockReturnValue({
        exec,
      });

      userModel.findOne.mockReturnValue({
        select,
      });

      const result = await service.findByEmail('John@Example.com');

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: 'john@example.com',
      });

      expect(select).toHaveBeenCalledWith('+passwordHash');
      expect(exec).toHaveBeenCalledTimes(1);
      expect(result).toEqual(user);
    });
  });

  describe('findByEmailWithoutPassword', () => {
    it('should find a user by lowercase email', async () => {
      const user = {
        _id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
      };

      const exec = vi.fn().mockResolvedValue(user);

      userModel.findOne.mockReturnValue({
        exec,
      });

      const result = await service.findByEmailWithoutPassword(
        'John@Example.com',
      );

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: 'john@example.com',
      });

      expect(exec).toHaveBeenCalledTimes(1);
      expect(result).toEqual(user);
    });
  });

  describe('findById', () => {
    it('should find a user by id', async () => {
      const user = {
        _id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
      };

      const exec = vi.fn().mockResolvedValue(user);

      userModel.findById.mockReturnValue({
        exec,
      });

      const result = await service.findById('user-123');

      expect(userModel.findById).toHaveBeenCalledWith('user-123');
      expect(exec).toHaveBeenCalledTimes(1);
      expect(result).toEqual(user);
    });
  });
});
