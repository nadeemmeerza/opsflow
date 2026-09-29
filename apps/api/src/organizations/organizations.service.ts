import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import {
  Organization,
  OrganizationDocument,
} from './schemas/organization.schema.js';
import { Model, Types } from 'mongoose';
import {
  OrganizationMember,
  OrganizationMemberDocument,
} from '../organization-members/schemas/organization-member.schema.js';
import { AuditService } from '../audit/audit.service.js';
import { OrganizationQueryDto } from './dto/organization-query.dto.js';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<OrganizationDocument>,

    @InjectModel(OrganizationMember.name)
    private readonly organizationMemberModel: Model<OrganizationMemberDocument>,

    private readonly auditService: AuditService,
  ) {}

  async create(
    name: string,
    slug: string,
    ownerId: string,
  ) {
    const normalizedSlug = slug.trim().toLowerCase();

    try {
      const organization = new this.organizationModel({
        name: name.trim(),
        slug: normalizedSlug,
        ownerId: new Types.ObjectId(ownerId),
      });

      const savedOrganization = await organization.save();

      await this.organizationMemberModel.create({
        organizationId: savedOrganization._id,
        userId: new Types.ObjectId(ownerId),
        role: 'owner',
      });

      await this.auditService.log({
        organizationId: savedOrganization._id.toString(),
        userId: ownerId,
        action: 'CREATE',
        entity: 'Organization',
        entityId: savedOrganization._id.toString(),
        metadata: {
          name: savedOrganization.name,
          slug: savedOrganization.slug,
        },
      });

      return savedOrganization;
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'An organization with this slug already exists',
        );
      }

      throw error;
    }
  }

/**
 * Returns all organizations in which the authenticated user
 * is a member.
 *
 * Organization visibility is membership-based, not ownership-based.
 * This allows owners, admins, and members to see organizations
 * they belong to.
 *
 * Search, filtering, sorting, and pagination are still performed
 * by MongoDB.
 */
async findAll(
  userId: string,
  query: OrganizationQueryDto,
) {
  const userObjectId =
    new Types.ObjectId(userId);

  const page = query.page ?? 1;
  const limit = query.limit ?? 10;

  /*
   * First determine which organizations the authenticated
   * user belongs to.
   *
   * This is the authorization boundary for organization
   * visibility. Ownership is intentionally not checked here.
   */
  const organizationIds =
    await this.organizationMemberModel.distinct(
      'organizationId',
      {
        userId: userObjectId,
      },
    );

  /*
   * If the user has no organization memberships, return
   * an empty paginated result without querying organizations.
   */
  if (organizationIds.length === 0) {
    return {
      items: [],

      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    };
  }

  /*
   * Start with membership-based organization visibility.
   */
  const filter: Record<string, any> = {
    _id: {
      $in: organizationIds,
    },
  };

  /*
   * Apply the optional status filter.
   */
  if (query.status) {
    filter.status = query.status;
  }

  /*
   * Escape search input before constructing the regular
   * expression so special regex characters are treated
   * as normal search text.
   */
  if (query.search?.trim()) {
    const searchRegex = new RegExp(
      query.search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'i',
    );

    filter.$or = [
      {
        name: searchRegex,
      },
      {
        slug: searchRegex,
      },
    ];
  }

  const sortBy =
    query.sortBy ?? 'createdAt';

  const sortOrder =
    query.sortOrder ?? 'desc';

  const sortDirection =
    sortOrder === 'asc' ? 1 : -1;

  const skip = (page - 1) * limit;

  /*
   * Fetch the requested page and total count in parallel.
   */
  const [items, total] =
    await Promise.all([
      this.organizationModel
        .find(filter)
        .sort({
          [sortBy]: sortDirection,
        })
        .skip(skip)
        .limit(limit)
        .exec(),

      this.organizationModel.countDocuments(
        filter,
      ),
    ]);

  return {
    items,

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(
        total / limit,
      ),
    },
  };
}
 

 /**
 * Returns an organization only when the authenticated
 * user is a member of that organization.
 *
 * Any organization member may view the organization.
 * Ownership is intentionally not required for read access.
 */
async findOne(
  id: string,
  userId: string,
) {
  const userObjectId =
    new Types.ObjectId(userId);

  /*
   * Verify organization membership before returning
   * organization data.
   */
  const membership =
    await this.organizationMemberModel
      .findOne({
        organizationId:
          new Types.ObjectId(id),

        userId: userObjectId,
      })
      .select('_id')
      .lean()
      .exec();

  if (!membership) {
    throw new NotFoundException(
      'Organization not found',
    );
  }

  const organization =
    await this.organizationModel
      .findById(id)
      .exec();

  if (!organization) {
    throw new NotFoundException(
      'Organization not found',
    );
  }

  return organization;
}

  /**
   * Mutations remain owner-scoped in the service as defense in depth.
   * RolesGuard provides the primary HTTP authorization decision.
   */
  async update(
    id: string,
    ownerId: string,
    data: {
      name?: string;
      slug?: string;
      status?: 'active' | 'suspended';
    },
  ) {
    const updateData = {
      ...data,
      ...(data.name !== undefined && {
        name: data.name.trim(),
      }),
      ...(data.slug !== undefined && {
        slug: data.slug.trim().toLowerCase(),
      }),
    };

    const organization = await this.organizationModel
      .findOneAndUpdate(
        {
          _id: id,
          ownerId: new Types.ObjectId(ownerId),
        },
        { $set: updateData },
        {
          new: true,
          runValidators: true,
        },
      )
      .exec();

    if (!organization) {
      throw new NotFoundException(
        'Organization not found',
      );
    }

    await this.auditService.log({
      organizationId: id,
      userId: ownerId,
      action: 'UPDATE',
      entity: 'Organization',
      entityId: organization._id.toString(),
      metadata: {
        updatedFields: Object.keys(updateData),
      },
    });

    return organization;
  }

  async remove(
    id: string,
    ownerId: string,
  ) {
    const organization = await this.organizationModel
      .findOneAndDelete({
        _id: id,
        ownerId: new Types.ObjectId(ownerId),
      })
      .exec();

    if (!organization) {
      throw new NotFoundException(
        'Organization not found',
      );
    }

    await this.auditService.log({
      organizationId: id,
      userId: ownerId,
      action: 'DELETE',
      entity: 'Organization',
      entityId: organization._id.toString(),
      metadata: {
        name: organization.name,
        slug: organization.slug,
      },
    });

    return {
      success: true,
      message: 'Organization deleted successfully',
    };
  }
}
