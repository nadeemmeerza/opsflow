import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Ticket, TicketDocument } from './schemas/ticket.schema.js';

import {
  Customer,
  CustomerDocument,
} from '../customers/schemas/customer.schema.js';

import {
  Project,
  ProjectDocument,
} from '../projects/schemas/project.schema.js';

import {
  OrganizationMember,
  OrganizationMemberDocument,
} from '../organization-members/schemas/organization-member.schema.js';
import { AuditService } from '../audit/audit.service.js';
import { TicketQueryDto } from './dto/ticket-query.dto.js';

@Injectable()
export class TicketsService {
  constructor(
    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<TicketDocument>,

    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,

    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,

    @InjectModel(OrganizationMember.name)
    private readonly memberModel: Model<OrganizationMemberDocument>,

    private readonly auditService: AuditService,
  ) {}

  async create(
    organizationId: string,
    userId: string,
    data: {
      title: string;
      description?: string;
      customerId: string;
      projectId?: string;
      assigneeId?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
    },
  ) {
    const organizationObjectId = new Types.ObjectId(organizationId);

    const customer = await this.customerModel.findOne({
      _id: new Types.ObjectId(data.customerId),
      organizationId: organizationObjectId,
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (data.projectId) {
      const project = await this.projectModel.findOne({
        _id: new Types.ObjectId(data.projectId),
        organizationId: organizationObjectId,
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }
    }

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
    }

    const ticket = await this.ticketModel.create({
      title: data.title.trim(),

      description: data.description?.trim() ?? '',

      organizationId: organizationObjectId,

      customerId: new Types.ObjectId(data.customerId),

      projectId: data.projectId ? new Types.ObjectId(data.projectId) : null,

      assigneeId: data.assigneeId ? new Types.ObjectId(data.assigneeId) : null,

      createdBy: new Types.ObjectId(userId),

      status: 'open',

      priority: data.priority ?? 'medium',
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: 'CREATE',
      entity: 'Ticket',
      entityId: ticket._id.toString(),
      metadata: {
        title: ticket.title,
        priority: ticket.priority,
        customerId: data.customerId,
      },
    });

    return ticket;
  }

  /**
   * Returns a paginated ticket list scoped to one organization.
   *
   * Search, filters, sorting, and pagination are performed by MongoDB.
   * The existing customer, project, and assignee population is preserved
   * so the frontend receives the same useful relationship data.
   */
  async findAll(organizationId: string, query: TicketQueryDto) {
    const organizationObjectId = new Types.ObjectId(organizationId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const filter: Record<string, any> = {
      organizationId: organizationObjectId,
    };

    /**
     * Optional workflow status filter.
     */
    if (query.status) {
      filter.status = query.status;
    }

    /**
     * Optional priority filter.
     */
    if (query.priority) {
      filter.priority = query.priority;
    }

    /**
     * Search the fields users are most likely to use
     * when locating a ticket.
     */
    if (query.search?.trim()) {
      const searchRegex = new RegExp(
        query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i',
      );

      filter.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    const sortBy = query.sortBy ?? 'createdAt';

    const sortOrder = query.sortOrder ?? 'desc';

    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    /**
     * Fetch the requested page and total count in parallel.
     */
    const [items, total] = await Promise.all([
      this.ticketModel
        .find(filter)
        .populate('customerId', 'name email phone company')
        .populate('projectId', 'name key status')
        .populate('assigneeId', 'name email status')
        .sort({
          [sortBy]: sortDirection,
        })
        .skip(skip)
        .limit(limit)
        .exec(),

      this.ticketModel.countDocuments(filter),
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

  async findOne(organizationId: string, ticketId: string) {
    const ticket = await this.ticketModel
      .findOne({
        _id: new Types.ObjectId(ticketId),
        organizationId: new Types.ObjectId(organizationId),
      })
      .populate('customerId', 'name email phone company')
      .populate('projectId', 'name key status')
      .populate('assigneeId', 'name email status')
      .exec();

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  async update(
    organizationId: string,
    ticketId: string,
    userId: string,
    data: {
      title?: string;
      description?: string;
      customerId?: string;
      projectId?: string;
      assigneeId?: string;
      status?: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
      priority?: 'low' | 'medium' | 'high' | 'urgent';
    },
  ) {
    const organizationObjectId = new Types.ObjectId(organizationId);

    if (data.customerId) {
      const customer = await this.customerModel.findOne({
        _id: new Types.ObjectId(data.customerId),
        organizationId: organizationObjectId,
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }
    }

    if (data.projectId) {
      const project = await this.projectModel.findOne({
        _id: new Types.ObjectId(data.projectId),
        organizationId: organizationObjectId,
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }
    }

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
    }

    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) {
      updateData.title = data.title.trim();
    }

    if (data.description !== undefined) {
      updateData.description = data.description.trim();
    }

    if (data.customerId !== undefined) {
      updateData.customerId = new Types.ObjectId(data.customerId);
    }

    if (data.projectId !== undefined) {
      updateData.projectId = new Types.ObjectId(data.projectId);
    }

    if (data.assigneeId !== undefined) {
      updateData.assigneeId = new Types.ObjectId(data.assigneeId);
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (data.priority !== undefined) {
      updateData.priority = data.priority;
    }

    const ticket = await this.ticketModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(ticketId),
          organizationId: organizationObjectId,
        },
        {
          $set: updateData,
        },
        {
          new: true,
          runValidators: true,
        },
      )
      .populate('customerId', 'name email phone company')
      .populate('projectId', 'name key status')
      .populate('assigneeId', 'name email status')
      .exec();

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    await this.auditService.log({
      organizationId,
      userId,
      action: 'UPDATE',
      entity: 'Ticket',
      entityId: ticket._id.toString(),
      metadata: {
        updatedFields: Object.keys(updateData),
      },
    });

    return ticket;
  }

  async remove(organizationId: string, ticketId: string, userId: string) {
    const ticket = await this.ticketModel
      .findOneAndDelete({
        _id: new Types.ObjectId(ticketId),
        organizationId: new Types.ObjectId(organizationId),
      })
      .exec();

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    await this.auditService.log({
      organizationId,
      userId,
      action: 'DELETE',
      entity: 'Ticket',
      entityId: ticket._id.toString(),
      metadata: {
        title: ticket.title,
      },
    });

    return {
      success: true,
      message: 'Ticket deleted successfully',
    };
  }
}
