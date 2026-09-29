import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { vi } from 'vitest';

import { ProjectsService } from './projects.service.js';
import {
  Project,
  ProjectDocument,
} from './schemas/project.schema.js';

import { AuditService } from '../audit/audit.service.js';
import { RedisService } from '../redis/redis.service.js';

type ProjectModelMock = {
  create: ReturnType<typeof vi.fn>;
  find: ReturnType<typeof vi.fn>;
  countDocuments: ReturnType<typeof vi.fn>;
  findOne: ReturnType<typeof vi.fn>;
  findOneAndUpdate: ReturnType<typeof vi.fn>;
  findOneAndDelete: ReturnType<typeof vi.fn>;
  hydrate: ReturnType<typeof vi.fn>;
};

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectModel: ProjectModelMock;

  let auditService: {
    log: ReturnType<typeof vi.fn>;
  };

  let redisService: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  const organizationId =
    '507f1f77bcf86cd799439011';

  const userId =
    '507f1f77bcf86cd799439012';

  const projectId =
    '507f1f77bcf86cd799439013';

  const projectCacheKey =
    `project:${organizationId}:${projectId}`;

  beforeEach(async () => {
    projectModel = {
      create: vi.fn(),
      find: vi.fn(),
      countDocuments: vi.fn(),
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
      findOneAndDelete: vi.fn(),
      hydrate: vi.fn(),
    };

    auditService = {
      log: vi.fn().mockResolvedValue(undefined),
    };

    redisService = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          ProjectsService,
          {
            provide: getModelToken(Project.name),
            useValue: projectModel,
          },
          {
            provide: AuditService,
            useValue: auditService,
          },
          {
            provide: RedisService,
            useValue: redisService,
          },
        ],
      }).compile();

    service =
      module.get<ProjectsService>(
        ProjectsService,
      );
  });

  describe('create', () => {
    it('should create a project with normalized values', async () => {
      const project = {
        _id: {
          toString: () => projectId,
        },
        name: 'Operations Platform',
        key: 'OPS',
        description:
          'Operations management platform',
      };

      projectModel.create.mockResolvedValue(
        project,
      );

      const result = await service.create(
        organizationId,
        userId,
        {
          name: '  Operations Platform  ',
          key: ' ops ',
          description:
            '  Operations management platform  ',
        },
      );

      expect(result).toBe(project);

      expect(
        projectModel.create,
      ).toHaveBeenCalledWith({
        name: 'Operations Platform',
        key: 'OPS',
        description:
          'Operations management platform',
        organizationId: expect.any(Object),
        createdBy: expect.any(Object),
        status: 'active',
      });

      expect(auditService.log).toHaveBeenCalledWith({
        organizationId,
        userId,
        action: 'CREATE',
        entity: 'Project',
        entityId: projectId,
        metadata: {
          name: project.name,
          key: project.key,
        },
      });

      expect(
        redisService.set,
      ).not.toHaveBeenCalled();
    });

    it('should use an empty description when none is provided', async () => {
      const project = {
        _id: {
          toString: () => projectId,
        },
        name: 'Operations',
        key: 'OPS',
      };

      projectModel.create.mockResolvedValue(
        project,
      );

      await service.create(
        organizationId,
        userId,
        {
          name: 'Operations',
          key: 'ops',
        },
      );

      expect(
        projectModel.create,
      ).toHaveBeenCalledWith({
        name: 'Operations',
        key: 'OPS',
        description: '',
        organizationId: expect.any(Object),
        createdBy: expect.any(Object),
        status: 'active',
      });
    });

    it('should throw ConflictException for a duplicate project key', async () => {
      projectModel.create.mockRejectedValue({
        code: 11000,
      });

      await expect(
        service.create(
          organizationId,
          userId,
          {
            name: 'Operations',
            key: 'OPS',
          },
        ),
      ).rejects.toThrow(
        new ConflictException(
          'A project with this key already exists in this organization',
        ),
      );

      expect(
        auditService.log,
      ).not.toHaveBeenCalled();
    });

    it('should rethrow unexpected database errors', async () => {
      const error = new Error(
        'Database unavailable',
      );

      projectModel.create.mockRejectedValue(
        error,
      );

      await expect(
        service.create(
          organizationId,
          userId,
          {
            name: 'Operations',
            key: 'OPS',
          },
        ),
      ).rejects.toThrow(error);
    });
  });

  describe('findAll', () => {
    it('should return paginated projects', async () => {
      const projects = [
        {
          _id: projectId,
          name: 'Operations',
          key: 'OPS',
        },
      ];

      const exec = vi
        .fn()
        .mockResolvedValue(projects);

      const limit = vi.fn().mockReturnValue({
        exec,
      });

      const skip = vi.fn().mockReturnValue({
        limit,
      });

      const sort = vi.fn().mockReturnValue({
        skip,
      });

      projectModel.find.mockReturnValue({
        sort,
      });

      projectModel.countDocuments.mockResolvedValue(
        25,
      );

      const result = await service.findAll(
        organizationId,
        {
          page: 2,
          limit: 10,
        } as any,
      );

      expect(result).toEqual({
        items: projects,
        pagination: {
          page: 2,
          limit: 10,
          total: 25,
          totalPages: 3,
        },
      });

      expect(
        projectModel.find,
      ).toHaveBeenCalledWith({
        organizationId: expect.any(Object),
      });

      expect(sort).toHaveBeenCalledWith({
        createdAt: -1,
      });

      expect(skip).toHaveBeenCalledWith(10);
      expect(limit).toHaveBeenCalledWith(10);

      expect(
        projectModel.countDocuments,
      ).toHaveBeenCalledWith({
        organizationId: expect.any(Object),
      });

      expect(
        redisService.get,
      ).not.toHaveBeenCalled();
    });

    it('should apply status and search filters', async () => {
      const exec = vi
        .fn()
        .mockResolvedValue([]);

      const limit = vi.fn().mockReturnValue({
        exec,
      });

      const skip = vi.fn().mockReturnValue({
        limit,
      });

      const sort = vi.fn().mockReturnValue({
        skip,
      });

      projectModel.find.mockReturnValue({
        sort,
      });

      projectModel.countDocuments.mockResolvedValue(
        0,
      );

      await service.findAll(
        organizationId,
        {
          page: 1,
          limit: 10,
          status: 'active',
          search: 'ops',
        } as any,
      );

      const findFilter =
        projectModel.find.mock.calls[0][0];

      expect(
        findFilter.organizationId,
      ).toEqual(expect.any(Object));

      expect(findFilter.status).toBe(
        'active',
      );

      expect(findFilter.$or).toEqual([
        {
          name: {
            $regex: 'ops',
            $options: 'i',
          },
        },
        {
          key: {
            $regex: 'ops',
            $options: 'i',
          },
        },
        {
          description: {
            $regex: 'ops',
            $options: 'i',
          },
        },
      ]);
    });

    it('should support ascending sorting', async () => {
      const exec = vi
        .fn()
        .mockResolvedValue([]);

      const limit = vi.fn().mockReturnValue({
        exec,
      });

      const skip = vi.fn().mockReturnValue({
        limit,
      });

      const sort = vi.fn().mockReturnValue({
        skip,
      });

      projectModel.find.mockReturnValue({
        sort,
      });

      projectModel.countDocuments.mockResolvedValue(
        0,
      );

      await service.findAll(
        organizationId,
        {
          page: 1,
          limit: 10,
          sortBy: 'name',
          sortOrder: 'asc',
        } as any,
      );

      expect(sort).toHaveBeenCalledWith({
        name: 1,
      });
    });

    it('should use default pagination values', async () => {
      const exec = vi
        .fn()
        .mockResolvedValue([]);

      const limit = vi.fn().mockReturnValue({
        exec,
      });

      const skip = vi.fn().mockReturnValue({
        limit,
      });

      const sort = vi.fn().mockReturnValue({
        skip,
      });

      projectModel.find.mockReturnValue({
        sort,
      });

      projectModel.countDocuments.mockResolvedValue(
        0,
      );

      const result = await service.findAll(
        organizationId,
        {} as any,
      );

      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      });

      expect(skip).toHaveBeenCalledWith(0);
      expect(limit).toHaveBeenCalledWith(10);
    });
  });

  describe('findOne', () => {
    it('should return a project from MongoDB on a cache miss', async () => {
      const project = {
        _id: projectId,
        name: 'Operations',
        key: 'OPS',

        // Mongoose documents expose toObject(). The mock needs
        // the same behavior because ProjectsService serializes
        // the document before putting it into Redis.
        toObject: vi.fn().mockReturnValue({
          _id: projectId,
          name: 'Operations',
          key: 'OPS',
        }),
      };

      redisService.get.mockResolvedValue(
        null,
      );

      projectModel.findOne.mockReturnValue({
        exec: vi
          .fn()
          .mockResolvedValue(project),
      });

      const result = await service.findOne(
        organizationId,
        projectId,
      );

      expect(result).toBe(project);

      expect(
        redisService.get,
      ).toHaveBeenCalledWith(
        projectCacheKey,
      );

      expect(
        projectModel.findOne,
      ).toHaveBeenCalledWith({
        _id: expect.any(Object),
        organizationId: expect.any(Object),
      });

      expect(
        project.toObject,
      ).toHaveBeenCalledTimes(1);

      expect(
        redisService.set,
      ).toHaveBeenCalledWith(
        projectCacheKey,
        {
          _id: projectId,
          name: 'Operations',
          key: 'OPS',
        },
        60,
      );
    });

    it('should return a project from Redis on a cache hit', async () => {
      const cachedProject = {
        _id: projectId,
        name: 'Operations',
        key: 'OPS',
      };

      const hydratedProject = {
        _id: projectId,
        name: 'Operations',
        key: 'OPS',
      };

      redisService.get.mockResolvedValue(
        cachedProject,
      );

      projectModel.hydrate.mockReturnValue(
        hydratedProject,
      );

      const result = await service.findOne(
        organizationId,
        projectId,
      );

      expect(result).toBe(
        hydratedProject,
      );

      expect(
        redisService.get,
      ).toHaveBeenCalledWith(
        projectCacheKey,
      );

      expect(
        projectModel.hydrate,
      ).toHaveBeenCalledWith(
        cachedProject,
      );

      expect(
        projectModel.findOne,
      ).not.toHaveBeenCalled();

      expect(
        redisService.set,
      ).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when project does not exist', async () => {
      redisService.get.mockResolvedValue(
        null,
      );

      projectModel.findOne.mockReturnValue({
        exec: vi
          .fn()
          .mockResolvedValue(null),
      });

      await expect(
        service.findOne(
          organizationId,
          projectId,
        ),
      ).rejects.toThrow(
        new NotFoundException(
          'Project not found',
        ),
      );

      expect(
        redisService.set,
      ).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update, audit, and invalidate the cache', async () => {
      const project = {
        _id: {
          toString: () => projectId,
        },
        name: 'Updated Operations',
        key: 'OPS2',
        description: 'Updated description',
      };

      const exec = vi
        .fn()
        .mockResolvedValue(project);

      projectModel.findOneAndUpdate.mockReturnValue({
        exec,
      });

      const result = await service.update(
        organizationId,
        projectId,
        userId,
        {
          name: '  Updated Operations  ',
          key: ' ops2 ',
          description:
            '  Updated description  ',
          status: 'active',
        },
      );

      expect(result).toBe(project);

      expect(
        projectModel.findOneAndUpdate,
      ).toHaveBeenCalledWith(
        {
          _id: expect.any(Object),
          organizationId: expect.any(Object),
        },
        {
          $set: {
            name: 'Updated Operations',
            key: 'OPS2',
            description:
              'Updated description',
            status: 'active',
          },
        },
        {
          new: true,
          runValidators: true,
        },
      );

      expect(auditService.log).toHaveBeenCalledWith({
        organizationId,
        userId,
        action: 'UPDATE',
        entity: 'Project',
        entityId: projectId,
        metadata: {
          updatedFields: [
            'name',
            'key',
            'description',
            'status',
          ],
        },
      });

      expect(
        redisService.delete,
      ).toHaveBeenCalledWith(
        projectCacheKey,
      );
    });

    it('should throw NotFoundException when updating a missing project', async () => {
      projectModel.findOneAndUpdate.mockReturnValue({
        exec: vi
          .fn()
          .mockResolvedValue(null),
      });

      await expect(
        service.update(
          organizationId,
          projectId,
          userId,
          {
            name: 'Updated',
          },
        ),
      ).rejects.toThrow(
        new NotFoundException(
          'Project not found',
        ),
      );

      expect(
        auditService.log,
      ).not.toHaveBeenCalled();

      expect(
        redisService.delete,
      ).not.toHaveBeenCalled();
    });

    it('should throw ConflictException for a duplicate project key', async () => {
      projectModel.findOneAndUpdate.mockReturnValue({
        exec: vi
          .fn()
          .mockRejectedValue({
            code: 11000,
          }),
      });

      await expect(
        service.update(
          organizationId,
          projectId,
          userId,
          {
            key: 'OPS',
          },
        ),
      ).rejects.toThrow(
        new ConflictException(
          'A project with this key already exists in this organization',
        ),
      );

      expect(
        auditService.log,
      ).not.toHaveBeenCalled();

      expect(
        redisService.delete,
      ).not.toHaveBeenCalled();
    });

    it('should rethrow unexpected database errors', async () => {
      const error = new Error(
        'Database unavailable',
      );

      projectModel.findOneAndUpdate.mockReturnValue({
        exec: vi
          .fn()
          .mockRejectedValue(error),
      });

      await expect(
        service.update(
          organizationId,
          projectId,
          userId,
          {
            name: 'Updated',
          },
        ),
      ).rejects.toThrow(error);

      expect(
        redisService.delete,
      ).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete the project, write an audit log, and invalidate the cache', async () => {
      const project = {
        _id: {
          toString: () => projectId,
        },
        name: 'Operations',
        key: 'OPS',
      };

      projectModel.findOneAndDelete.mockReturnValue({
        exec: vi
          .fn()
          .mockResolvedValue(project),
      });

      const result = await service.remove(
        organizationId,
        projectId,
        userId,
      );

      expect(result).toEqual({
        success: true,
        message:
          'Project deleted successfully',
      });

      expect(
        projectModel.findOneAndDelete,
      ).toHaveBeenCalledWith({
        _id: expect.any(Object),
        organizationId: expect.any(Object),
      });

      expect(auditService.log).toHaveBeenCalledWith({
        organizationId,
        userId,
        action: 'DELETE',
        entity: 'Project',
        entityId: projectId,
        metadata: {
          name: project.name,
          key: project.key,
        },
      });

      expect(
        redisService.delete,
      ).toHaveBeenCalledWith(
        projectCacheKey,
      );
    });

    it('should throw NotFoundException when deleting a missing project', async () => {
      projectModel.findOneAndDelete.mockReturnValue({
        exec: vi
          .fn()
          .mockResolvedValue(null),
      });

      await expect(
        service.remove(
          organizationId,
          projectId,
          userId,
        ),
      ).rejects.toThrow(
        new NotFoundException(
          'Project not found',
        ),
      );

      expect(
        auditService.log,
      ).not.toHaveBeenCalled();

      expect(
        redisService.delete,
      ).not.toHaveBeenCalled();
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});