import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { vi } from 'vitest';

import { TasksService } from './tasks.service.js';
import { Task } from './schemas/task.schema.js';
import { Project } from '../projects/schemas/project.schema.js';
import { OrganizationMember } from '../organization-members/schemas/organization-member.schema.js';
import { AuditService } from '../audit/audit.service.js';

type ModelMock = {
  create: ReturnType<typeof vi.fn>;
  find: ReturnType<typeof vi.fn>;
  countDocuments: ReturnType<typeof vi.fn>;
  findOne: ReturnType<typeof vi.fn>;
  findOneAndUpdate: ReturnType<typeof vi.fn>;
  findOneAndDelete: ReturnType<typeof vi.fn>;
};

describe('TasksService', () => {
  let service: TasksService;
  let taskModel: ModelMock;
  let projectModel: ModelMock;
  let memberModel: ModelMock;

  let auditService: {
    log: ReturnType<typeof vi.fn>;
  };

  const organizationId = '507f1f77bcf86cd799439011';
  const projectId = '507f1f77bcf86cd799439012';
  const userId = '507f1f77bcf86cd799439013';
  const taskId = '507f1f77bcf86cd799439014';
  const assigneeId = '507f1f77bcf86cd799439015';

  beforeEach(async () => {
    taskModel = {
      create: vi.fn(),
      find: vi.fn(),
      countDocuments: vi.fn(),
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
      findOneAndDelete: vi.fn(),
    };

    projectModel = {
      create: vi.fn(),
      find: vi.fn(),
      countDocuments: vi.fn(),
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
      findOneAndDelete: vi.fn(),
    };

    memberModel = {
      create: vi.fn(),
      find: vi.fn(),
      countDocuments: vi.fn(),
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
      findOneAndDelete: vi.fn(),
    };

    auditService = {
      log: vi.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getModelToken(Task.name),
          useValue: taskModel,
        },
        {
          provide: getModelToken(Project.name),
          useValue: projectModel,
        },
        {
          provide: getModelToken(OrganizationMember.name),
          useValue: memberModel,
        },
        {
          provide: AuditService,
          useValue: auditService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  describe('create', () => {
    it('should create a task with normalized values', async () => {
      const project = {
        _id: projectId,
        name: 'Operations',
      };

      const task = {
        _id: {
          toString: () => taskId,
        },
        title: 'Fix production issue',
        description: 'Investigate API failure',
      };

      projectModel.findOne.mockResolvedValue(project);
      taskModel.create.mockResolvedValue(task);

      const result = await service.create(organizationId, projectId, userId, {
        title: '  Fix production issue  ',
        description: '  Investigate API failure  ',
        priority: 'high',
        dueDate: '2026-09-30',
      });

      expect(result).toBe(task);

      expect(projectModel.findOne).toHaveBeenCalledWith({
        _id: expect.any(Object),
        organizationId: expect.any(Object),
      });

      expect(taskModel.create).toHaveBeenCalledWith({
        title: 'Fix production issue',
        description: 'Investigate API failure',
        projectId: expect.any(Object),
        organizationId: expect.any(Object),
        createdBy: expect.any(Object),
        assigneeId: null,
        priority: 'high',
        status: 'todo',
        dueDate: expect.any(Date),
      });

      expect(auditService.log).toHaveBeenCalledWith({
        organizationId,
        userId,
        action: 'CREATE',
        entity: 'Task',
        entityId: taskId,
        metadata: {
          title: task.title,
          projectId,
        },
      });
    });

    it('should use default values when optional fields are omitted', async () => {
      projectModel.findOne.mockResolvedValue({
        _id: projectId,
      });

      const task = {
        _id: {
          toString: () => taskId,
        },
        title: 'New task',
      };

      taskModel.create.mockResolvedValue(task);

      await service.create(organizationId, projectId, userId, {
        title: 'New task',
      });

      expect(taskModel.create).toHaveBeenCalledWith({
        title: 'New task',
        description: '',
        projectId: expect.any(Object),
        organizationId: expect.any(Object),
        createdBy: expect.any(Object),
        assigneeId: null,
        priority: 'medium',
        status: 'todo',
        dueDate: null,
      });
    });

    it('should create a task with a valid organization member as assignee', async () => {
      projectModel.findOne.mockResolvedValue({
        _id: projectId,
      });

      memberModel.findOne.mockResolvedValue({
        _id: 'membership-1',
        userId: assigneeId,
      });

      const task = {
        _id: {
          toString: () => taskId,
        },
        title: 'Assigned task',
      };

      taskModel.create.mockResolvedValue(task);

      await service.create(organizationId, projectId, userId, {
        title: 'Assigned task',
        assigneeId,
      });

      expect(memberModel.findOne).toHaveBeenCalledWith({
        organizationId: expect.any(Object),
        userId: expect.any(Object),
      });

      expect(taskModel.create).toHaveBeenCalledWith({
        title: 'Assigned task',
        description: '',
        projectId: expect.any(Object),
        organizationId: expect.any(Object),
        createdBy: expect.any(Object),
        assigneeId: expect.any(Object),
        priority: 'medium',
        status: 'todo',
        dueDate: null,
      });
    });

    it('should throw NotFoundException when the project does not exist', async () => {
      projectModel.findOne.mockResolvedValue(null);

      await expect(
        service.create(organizationId, projectId, userId, {
          title: 'New task',
        }),
      ).rejects.toThrow(new NotFoundException('Project not found'));

      expect(taskModel.create).not.toHaveBeenCalled();
      expect(auditService.log).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when assignee is not an organization member', async () => {
      projectModel.findOne.mockResolvedValue({
        _id: projectId,
      });

      memberModel.findOne.mockResolvedValue(null);

      await expect(
        service.create(organizationId, projectId, userId, {
          title: 'Assigned task',
          assigneeId,
        }),
      ).rejects.toThrow(
        new ConflictException('Assignee is not a member of this organization'),
      );

      expect(taskModel.create).not.toHaveBeenCalled();
      expect(auditService.log).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    function setupFindQuery(items: unknown[]) {
      const exec = vi.fn().mockResolvedValue(items);

      const limit = vi.fn().mockReturnValue({
        exec,
      });

      const skip = vi.fn().mockReturnValue({
        limit,
      });

      const sort = vi.fn().mockReturnValue({
        skip,
      });

      const populate = vi.fn().mockReturnValue({
        sort,
      });

      taskModel.find.mockReturnValue({
        populate,
      });

      return {
        exec,
        populate,
        sort,
        skip,
        limit,
      };
    }

    it('should return paginated tasks', async () => {
      const tasks = [
        {
          _id: taskId,
          title: 'Task one',
        },
      ];

      const query = setupFindQuery(tasks);

      taskModel.countDocuments.mockResolvedValue(25);

      const result = await service.findAll(organizationId, projectId, {
        page: 2,
        limit: 10,
      } as any);

      expect(result).toEqual({
        items: tasks,
        pagination: {
          page: 2,
          limit: 10,
          total: 25,
          totalPages: 3,
        },
      });

      expect(taskModel.find).toHaveBeenCalledWith({
        organizationId: expect.any(Object),
        projectId: expect.any(Object),
      });

      expect(query.populate).toHaveBeenCalledWith(
        'assigneeId',
        'name email status',
      );

      expect(query.sort).toHaveBeenCalledWith({
        createdAt: -1,
      });

      expect(query.skip).toHaveBeenCalledWith(10);
      expect(query.limit).toHaveBeenCalledWith(10);

      expect(taskModel.countDocuments).toHaveBeenCalledWith({
        organizationId: expect.any(Object),
        projectId: expect.any(Object),
      });
    });

    it('should apply status, priority and search filters', async () => {
      const query = setupFindQuery([]);

      taskModel.countDocuments.mockResolvedValue(0);

      await service.findAll(organizationId, projectId, {
        page: 1,
        limit: 10,
        status: 'in_progress',
        priority: 'high',
        search: 'production',
      } as any);

      const filter = taskModel.find.mock.calls[0][0];

      expect(filter.organizationId).toEqual(expect.any(Object));

      expect(filter.projectId).toEqual(expect.any(Object));

      expect(filter.status).toBe('in_progress');
      expect(filter.priority).toBe('high');

      expect(filter.$or).toHaveLength(2);
      expect(filter.$or[0]).toEqual({
        title: expect.any(RegExp),
      });
      expect(filter.$or[1]).toEqual({
        description: expect.any(RegExp),
      });

      expect(query.populate).toHaveBeenCalledWith(
        'assigneeId',
        'name email status',
      );
    });

    it('should escape special regex characters in search', async () => {
      setupFindQuery([]);
      taskModel.countDocuments.mockResolvedValue(0);

      await service.findAll(organizationId, projectId, {
        search: 'ops.test',
      } as any);

      const filter = taskModel.find.mock.calls[0][0];

      expect(filter.$or[0].title).toEqual(/ops\.test/i);
    });

    it('should support ascending sorting', async () => {
      const query = setupFindQuery([]);

      taskModel.countDocuments.mockResolvedValue(0);

      await service.findAll(organizationId, projectId, {
        sortBy: 'priority',
        sortOrder: 'asc',
      } as any);

      expect(query.sort).toHaveBeenCalledWith({
        priority: 1,
      });
    });

    it('should use default pagination values', async () => {
      const query = setupFindQuery([]);

      taskModel.countDocuments.mockResolvedValue(0);

      const result = await service.findAll(
        organizationId,
        projectId,
        {} as any,
      );

      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      });

      expect(query.skip).toHaveBeenCalledWith(0);
      expect(query.limit).toHaveBeenCalledWith(10);
    });
  });

  describe('findOne', () => {
    it('should return a task with populated assignee', async () => {
      const task = {
        _id: taskId,
        title: 'Production task',
      };

      const populate = vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue(task),
      });

      taskModel.findOne.mockReturnValue({
        populate,
      });

      const result = await service.findOne(organizationId, projectId, taskId);

      expect(result).toBe(task);

      expect(taskModel.findOne).toHaveBeenCalledWith({
        _id: expect.any(Object),
        organizationId: expect.any(Object),
        projectId: expect.any(Object),
      });

      expect(populate).toHaveBeenCalledWith('assigneeId', 'name email status');
    });

    it('should throw NotFoundException when task does not exist', async () => {
      taskModel.findOne.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(null),
        }),
      });

      await expect(
        service.findOne(organizationId, projectId, taskId),
      ).rejects.toThrow(new NotFoundException('Task not found'));
    });
  });

  describe('update', () => {
    it('should update and audit a task', async () => {
      const task = {
        _id: {
          toString: () => taskId,
        },
        title: 'Updated task',
      };

      memberModel.findOne.mockResolvedValue({
        _id: 'membership-1',
      });

      const exec = vi.fn().mockResolvedValue(task);

      const populate = vi.fn().mockReturnValue({
        exec,
      });

      taskModel.findOneAndUpdate.mockReturnValue({
        populate,
      });

      const result = await service.update(
        organizationId,
        projectId,
        taskId,
        userId,
        {
          title: '  Updated task  ',
          description: '  Updated description  ',
          assigneeId,
          status: 'in_progress',
          priority: 'high',
          dueDate: '2026-10-01',
        },
      );

      expect(result).toBe(task);

      expect(memberModel.findOne).toHaveBeenCalledWith({
        organizationId: expect.any(Object),
        userId: expect.any(Object),
      });

      expect(taskModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: expect.any(Object),
          organizationId: expect.any(Object),
          projectId: expect.any(Object),
        },
        {
          $set: {
            title: 'Updated task',
            description: 'Updated description',
            assigneeId: expect.any(Object),
            status: 'in_progress',
            priority: 'high',
            dueDate: expect.any(Date),
          },
        },
        {
          new: true,
          runValidators: true,
        },
      );

      expect(populate).toHaveBeenCalledWith('assigneeId', 'name email status');

      expect(auditService.log).toHaveBeenCalledWith({
        organizationId,
        userId,
        action: 'UPDATE',
        entity: 'Task',
        entityId: taskId,
        metadata: {
          updatedFields: [
            'title',
            'description',
            'status',
            'priority',
            'dueDate',
            'assigneeId',
          ],
        },
      });
    });

    it('should update without assignee validation when assigneeId is not provided', async () => {
      const task = {
        _id: {
          toString: () => taskId,
        },
        title: 'Updated task',
      };

      const exec = vi.fn().mockResolvedValue(task);

      taskModel.findOneAndUpdate.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          exec,
        }),
      });

      await service.update(organizationId, projectId, taskId, userId, {
        title: 'Updated task',
      });

      expect(memberModel.findOne).not.toHaveBeenCalled();

      expect(taskModel.findOneAndUpdate).toHaveBeenCalled();

      expect(auditService.log).toHaveBeenCalled();
    });

    it('should throw ConflictException when new assignee is not a member', async () => {
      memberModel.findOne.mockResolvedValue(null);

      await expect(
        service.update(organizationId, projectId, taskId, userId, {
          assigneeId,
        }),
      ).rejects.toThrow(
        new ConflictException('Assignee is not a member of this organization'),
      );

      expect(taskModel.findOneAndUpdate).not.toHaveBeenCalled();

      expect(auditService.log).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when updating a missing task', async () => {
      taskModel.findOneAndUpdate.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(null),
        }),
      });

      await expect(
        service.update(organizationId, projectId, taskId, userId, {
          title: 'Updated task',
        }),
      ).rejects.toThrow(new NotFoundException('Task not found'));

      expect(auditService.log).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a task and write an audit log', async () => {
      const task = {
        _id: {
          toString: () => taskId,
        },
        title: 'Task to delete',
      };

      taskModel.findOneAndDelete.mockResolvedValue(task);

      const result = await service.remove(
        organizationId,
        projectId,
        taskId,
        userId,
      );

      expect(result).toEqual({
        success: true,
        message: 'Task deleted successfully',
      });

      expect(taskModel.findOneAndDelete).toHaveBeenCalledWith({
        _id: expect.any(Object),
        organizationId: expect.any(Object),
        projectId: expect.any(Object),
      });

      expect(auditService.log).toHaveBeenCalledWith({
        organizationId,
        userId,
        action: 'DELETE',
        entity: 'Task',
        entityId: taskId,
        metadata: {
          title: task.title,
        },
      });
    });

    it('should throw NotFoundException when deleting a missing task', async () => {
      taskModel.findOneAndDelete.mockResolvedValue(null);

      await expect(
        service.remove(organizationId, projectId, taskId, userId),
      ).rejects.toThrow(new NotFoundException('Task not found'));

      expect(auditService.log).not.toHaveBeenCalled();
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
