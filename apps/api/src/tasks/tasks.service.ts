import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model, Types } from 'mongoose';

import { Task, TaskDocument } from './schemas/task.schema.js';

import {
  Project,
  ProjectDocument,
} from '../projects/schemas/project.schema.js';

import {
  OrganizationMember,
  OrganizationMemberDocument,
} from '../organization-members/schemas/organization-member.schema.js';
import { AuditService } from '../audit/audit.service.js';
import { TaskQueryDto } from './dto/task-query.dto.js';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,

    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,

    @InjectModel(OrganizationMember.name)
    private readonly memberModel: Model<OrganizationMemberDocument>,

    private readonly auditService: AuditService,
  ) {}

  async create(
    organizationId: string,
    projectId: string,
    userId: string,
    data: {
      title: string;
      description?: string;
      assigneeId?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      dueDate?: string;
    },
  ) {
    const organizationObjectId = new Types.ObjectId(organizationId);

    const projectObjectId = new Types.ObjectId(projectId);

    // Verify project belongs to organization
    const project = await this.projectModel.findOne({
      _id: projectObjectId,
      organizationId: organizationObjectId,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verify assignee belongs to organization
    if (data.assigneeId) {
      const assignee = await this.memberModel.findOne({
        organizationId: organizationObjectId,
        userId: new Types.ObjectId(data.assigneeId),
      });

      if (!assignee) {
        throw new ConflictException(
          'Assignee is not a member of this organization',
        );
      }
    }

    const task = await this.taskModel.create({
      title: data.title.trim(),
      description: data.description?.trim() ?? '',
      projectId: projectObjectId,
      organizationId: organizationObjectId,
      createdBy: new Types.ObjectId(userId),
      assigneeId: data.assigneeId ? new Types.ObjectId(data.assigneeId) : null,
      priority: data.priority ?? 'medium',
      status: 'todo',
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: 'CREATE',
      entity: 'Task',
      entityId: task._id.toString(),
      metadata: {
        title: task.title,
        projectId: projectId,
      },
    });

    return task;
  }

/**
 * Returns a paginated task list scoped to one organization and project.
 *
 * Search, filters, sorting, and pagination are performed by MongoDB
 * rather than loading the complete task collection into the frontend.
 */
async findAll(
  organizationId: string,
  projectId: string,
  query: TaskQueryDto,
) {
  const organizationObjectId = new Types.ObjectId(organizationId);
  const projectObjectId = new Types.ObjectId(projectId);

  const page = query.page ?? 1;
  const limit = query.limit ?? 10;

  const filter: Record<string, any> = {
    organizationId: organizationObjectId,
    projectId: projectObjectId,
  };

  /**
   * Status and priority filters are added only when supplied.
   */
  if (query.status) {
    filter.status = query.status;
  }

  if (query.priority) {
    filter.priority = query.priority;
  }

  /**
   * Search is performed against the fields users naturally search
   * when working with tasks.
   */
  if (query.search?.trim()) {
    const searchRegex = new RegExp(
      query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'i',
    );

    filter.$or = [
      { title: searchRegex },
      { description: searchRegex },
    ];
  }

  /**
   * Only allow fields explicitly exposed by TaskQueryDto to become
   * MongoDB sort fields.
   */
  const sortBy = query.sortBy ?? 'createdAt';
  const sortOrder = query.sortOrder ?? 'desc';

  const sortDirection = sortOrder === 'asc' ? 1 : -1;

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    this.taskModel
      .find(filter)
      .populate('assigneeId', 'name email status')
      .sort({
        [sortBy]: sortDirection,
      })
      .skip(skip)
      .limit(limit)
      .exec(),

    this.taskModel.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

  async findOne(organizationId: string, projectId: string, taskId: string) {
    const task = await this.taskModel
      .findOne({
        _id: new Types.ObjectId(taskId),
        organizationId: new Types.ObjectId(organizationId),
        projectId: new Types.ObjectId(projectId),
      })
      .populate('assigneeId', 'name email status')
      .exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(
    organizationId: string,
    projectId: string,
    taskId: string,
    userId: string,
    data: {
      title?: string;
      description?: string;
      assigneeId?: string;
      status?: 'todo' | 'in_progress' | 'review' | 'done';
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      dueDate?: string;
    },
  ) {
    const organizationObjectId = new Types.ObjectId(organizationId);

    const updateData: any = {
      ...data,

      ...(data.title !== undefined && {
        title: data.title.trim(),
      }),

      ...(data.description !== undefined && {
        description: data.description.trim(),
      }),

      ...(data.assigneeId !== undefined && {
        assigneeId: data.assigneeId
          ? new Types.ObjectId(data.assigneeId)
          : null,
      }),

      ...(data.dueDate !== undefined && {
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      }),
    };

    delete updateData.assigneeId;

    if (data.assigneeId) {
      const member = await this.memberModel.findOne({
        organizationId: organizationObjectId,
        userId: new Types.ObjectId(data.assigneeId),
      });

      if (!member) {
        throw new ConflictException(
          'Assignee is not a member of this organization',
        );
      }

      updateData.assigneeId = new Types.ObjectId(data.assigneeId);
    }

    const task = await this.taskModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(taskId),
          organizationId: organizationObjectId,
          projectId: new Types.ObjectId(projectId),
        },
        {
          $set: updateData,
        },
        {
          new: true,
          runValidators: true,
        },
      )
      .populate('assigneeId', 'name email status')
      .exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.auditService.log({
      organizationId,
      userId,
      action: 'UPDATE',
      entity: 'Task',
      entityId: task._id.toString(),
      metadata: {
        updatedFields: Object.keys(updateData),
      },
    });

    return task;
  }

  async remove(
    organizationId: string,
    projectId: string,
    taskId: string,
    userId: string,
  ) {
    const task = await this.taskModel.findOneAndDelete({
      _id: new Types.ObjectId(taskId),
      organizationId: new Types.ObjectId(organizationId),
      projectId: new Types.ObjectId(projectId),
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.auditService.log({
      organizationId,
      userId,
      action: 'DELETE',
      entity: 'Task',
      entityId: task._id.toString(),
      metadata: {
        title: task.title,
      },
    });

    return {
      success: true,
      message: 'Task deleted successfully',
    };
  }
}
