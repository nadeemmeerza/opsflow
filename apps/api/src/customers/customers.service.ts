import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Customer, CustomerDocument } from './schemas/customer.schema.js';
import { AuditService } from '../audit/audit.service.js';
import { CustomerQueryDto } from './dto/customer-query.dto.js';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,

    private readonly auditService: AuditService,
  ) {}

  async create(
    organizationId: string,
    userId: string,
    data: {
      name: string;
      email?: string;
      phone?: string;
      company?: string;
      notes?: string;
    },
  ) {
    const organizationObjectId = new Types.ObjectId(organizationId);

    const email = data.email?.trim().toLowerCase();

    if (email) {
      const existing = await this.customerModel.findOne({
        organizationId: organizationObjectId,
        email,
      });

      if (existing) {
        throw new ConflictException(
          'A customer with this email already exists',
        );
      }
    }

    const customer = await this.customerModel.create({
      name: data.name.trim(),
      email,
      phone: data.phone?.trim(),
      company: data.company?.trim(),
      notes: data.notes?.trim() ?? '',
      organizationId: organizationObjectId,
      createdBy: new Types.ObjectId(userId),
      status: 'active',
    });

    await this.auditService.log({
      organizationId,
      userId,
      action: 'CREATE',
      entity: 'Customer',
      entityId: customer._id.toString(),
      metadata: {
        name: customer.name,
        email: customer.email,
        company: customer.company,
      },
    });

    return customer;
  }

  /**
   * Returns a paginated customer list for one organization.
   *
   * MongoDB performs the filtering, searching, sorting, and pagination.
   * This keeps the API efficient as the organization grows.
   */
  async findAll(organizationId: string, query: CustomerQueryDto) {
    const organizationObjectId = new Types.ObjectId(organizationId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const filter: Record<string, any> = {
      organizationId: organizationObjectId,
    };

    /**
     * Optional status filtering.
     */
    if (query.status) {
      filter.status = query.status;
    }

    /**
     * Search across the fields that are most useful
     * when locating a customer.
     */
    if (query.search?.trim()) {
      const searchRegex = new RegExp(
        query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i',
      );

      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { company: searchRegex },
      ];
    }

    /**
     * Defaults keep the newest customers at the top,
     * matching the previous customer list behavior.
     */
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    /**
     * Fetch the current page and total count together.
     */
    const [items, total] = await Promise.all([
      this.customerModel
        .find(filter)
        .sort({
          [sortBy]: sortDirection,
        })
        .skip(skip)
        .limit(limit)
        .exec(),

      this.customerModel.countDocuments(filter),
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

  async findOne(organizationId: string, customerId: string) {
    const customer = await this.customerModel
      .findOne({
        _id: new Types.ObjectId(customerId),
        organizationId: new Types.ObjectId(organizationId),
      })
      .exec();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async update(
    organizationId: string,
    customerId: string,
    userId: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      company?: string;
      notes?: string;
      status?: 'active' | 'inactive';
    },
  ) {
    const organizationObjectId = new Types.ObjectId(organizationId);

    const email = data.email?.trim().toLowerCase();

    if (email) {
      const existing = await this.customerModel.findOne({
        organizationId: organizationObjectId,
        email,
        _id: {
          $ne: new Types.ObjectId(customerId),
        },
      });

      if (existing) {
        throw new ConflictException(
          'A customer with this email already exists',
        );
      }
    }

    const updateData = {
      ...data,

      ...(data.name !== undefined && {
        name: data.name.trim(),
      }),

      ...(data.email !== undefined && {
        email,
      }),

      ...(data.phone !== undefined && {
        phone: data.phone.trim(),
      }),

      ...(data.company !== undefined && {
        company: data.company.trim(),
      }),

      ...(data.notes !== undefined && {
        notes: data.notes.trim(),
      }),
    };

    const customer = await this.customerModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(customerId),
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
      .exec();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async remove(organizationId: string, customerId: string, userId: string) {
    const customer = await this.customerModel
      .findOneAndDelete({
        _id: new Types.ObjectId(customerId),
        organizationId: new Types.ObjectId(organizationId),
      })
      .exec();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return {
      success: true,
      message: 'Customer deleted successfully',
    };
  }
}
