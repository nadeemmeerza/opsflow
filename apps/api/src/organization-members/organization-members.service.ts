import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model, Types } from 'mongoose';

import {
  OrganizationMember,
  OrganizationMemberDocument,
} from './schemas/organization-member.schema.js';

import {
  User,
  UserDocument,
} from '../users/schemas/user.schema.js';

import { AuditService } from '../audit/audit.service.js';

import { MemberQueryDto } from './dto/member-query.dto.js';

@Injectable()
export class OrganizationMembersService {
  constructor(
    @InjectModel(OrganizationMember.name)
    private readonly memberModel: Model<OrganizationMemberDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    private readonly auditService: AuditService,
  ) {}

  /**
   * Returns organization members with search, filtering,
   * sorting, and pagination.
   *
   * MongoDB performs the user lookup, search, sorting,
   * and pagination so that the complete member collection
   * does not need to be loaded into application memory.
   */
  async findAll(
    organizationId: string,
    userId: string,
    query: MemberQueryDto,
  ) {
    const organizationObjectId =
      new Types.ObjectId(organizationId);

    const userObjectId =
      new Types.ObjectId(userId);

    /*
     * Verify that the requester belongs to the organization
     * before exposing any member information.
     */
    const membership =
      await this.memberModel.findOne({
        organizationId: organizationObjectId,
        userId: userObjectId,
      });

    if (!membership) {
      throw new NotFoundException(
        'Organization not found',
      );
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    /*
     * The initial match keeps the aggregation scoped to
     * the requested organization and optional role filter.
     */
    const match: Record<string, unknown> = {
      organizationId: organizationObjectId,
    };

    if (query.role) {
      match.role = query.role;
    }

    /*
     * Escape regular-expression characters so that a user's
     * search text is treated as normal text rather than
     * arbitrary regex input.
     */
    const escapedSearch = query.search
      ?.trim()
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const searchRegex = escapedSearch
      ? new RegExp(escapedSearch, 'i')
      : null;

    /*
     * $lookup joins organization memberships with their
     * corresponding User documents.
     *
     * This allows search and sorting by user name/email.
     */
    const pipeline: any[] = [
      {
        $match: match,
      },

      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },

      {
        $unwind: '$user',
      },
    ];

    /*
     * Search members by their name or email address.
     */
    if (searchRegex) {
      pipeline.push({
        $match: {
          $or: [
            {
              'user.name': searchRegex,
            },
            {
              'user.email': searchRegex,
            },
          ],
        },
      });
    }

    /*
     * Convert the frontend sort option into the actual
     * MongoDB field used by the aggregation.
     */
    const sortField =
      query.sortBy === 'name'
        ? 'user.name'
        : query.sortBy === 'email'
          ? 'user.email'
          : query.sortBy === 'role'
            ? 'role'
            : 'createdAt';

    const sortDirection =
      query.sortOrder === 'asc' ? 1 : -1;

    pipeline.push({
      $sort: {
        [sortField]: sortDirection,
      },
    });

    /*
     * $facet calculates both:
     *
     * 1. The members for the requested page.
     * 2. The total number of matching members.
     *
     * Both results therefore come from the same filtered
     * dataset.
     */
    pipeline.push({
      $facet: {
        items: [
          {
            $skip: skip,
          },

          {
            $limit: limit,
          },

          /*
           * Return only the fields required by the frontend.
           * The nested user object is intentionally kept small.
           */
          {
            $project: {
              _id: 1,
              organizationId: 1,
              userId: 1,
              role: 1,
              createdAt: 1,
              updatedAt: 1,

              user: {
                id: '$user._id',
                name: '$user.name',
                email: '$user.email',
              },
            },
          },
        ],

        metadata: [
          {
            $count: 'total',
          },
        ],
      },
    });

    const [result] =
      await this.memberModel.aggregate(
        pipeline,
      );

    const total =
      result?.metadata?.[0]?.total ?? 0;

    return {
      items: result?.items ?? [],

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
   * Adds an existing OpsFlow user to an organization.
   *
   * The user must already exist in the users collection.
   * This operation is intentionally different from user
   * registration or invitation.
   */
  async addMember(
    organizationId: string,
    currentUserId: string,
    email: string,
    role: 'admin' | 'member',
  ) {
    const organizationObjectId =
      new Types.ObjectId(organizationId);

    const currentUserObjectId =
      new Types.ObjectId(currentUserId);

    /*
     * Verify that the requester belongs to the
     * organization before modifying membership.
     */
    const currentMembership =
      await this.memberModel.findOne({
        organizationId: organizationObjectId,
        userId: currentUserObjectId,
      });

    if (!currentMembership) {
      throw new NotFoundException(
        'Organization not found',
      );
    }

    /*
     * Find the existing OpsFlow user by normalized email.
     */
    const targetUser =
      await this.userModel
        .findOne({
          email: email
            .toLowerCase()
            .trim(),
        })
        .exec();

    if (!targetUser) {
      throw new NotFoundException(
        'User not found',
      );
    }

    /*
     * Prevent duplicate membership in the same
     * organization.
     */
    const existingMembership =
      await this.memberModel.findOne({
        organizationId: organizationObjectId,
        userId: targetUser._id,
      });

    if (existingMembership) {
      throw new ConflictException(
        'User is already a member of this organization',
      );
    }

    /*
     * Create the organization membership.
     */
    const membership =
      await this.memberModel.create({
        organizationId: organizationObjectId,
        userId: targetUser._id,
        role,
      });

    /*
     * Record the membership creation in the
     * organization audit trail.
     */
    await this.auditService.log({
      organizationId,
      userId: currentUserId,
      action: 'ADD_MEMBER',
      entity: 'OrganizationMember',
      entityId:
        membership._id.toString(),
      metadata: {
        memberUserId:
          targetUser._id.toString(),
        role,
      },
    });

    return membership;
  }

  /**
   * Changes an existing member's organization role.
   *
   * Business rules:
   * - The requester must belong to the organization.
   * - The target member must belong to the same organization.
   * - Owner cannot be changed through this endpoint.
   * - Only admin/member roles can be assigned.
   * - Successful changes are written to the audit log.
   */
  async updateMemberRole(
    organizationId: string,
    currentUserId: string,
    memberId: string,
    role: 'admin' | 'member',
  ) {
    const organizationObjectId =
      new Types.ObjectId(organizationId);

    const currentUserObjectId =
      new Types.ObjectId(currentUserId);

    const memberObjectId =
      new Types.ObjectId(memberId);

    /*
     * Confirm that the requester belongs to this
     * organization.
     */
    const currentMembership =
      await this.memberModel.findOne({
        organizationId: organizationObjectId,
        userId: currentUserObjectId,
      });

    if (!currentMembership) {
      throw new NotFoundException(
        'Organization not found',
      );
    }

    /*
     * Find the target membership within the same
     * organization. This prevents modifying a membership
     * belonging to another organization.
     */
    const targetMembership =
      await this.memberModel.findOne({
        _id: memberObjectId,
        organizationId: organizationObjectId,
      });

    if (!targetMembership) {
      throw new NotFoundException(
        'Member not found',
      );
    }

    /*
     * Ownership is protected from ordinary role
     * management operations.
     */
    if (targetMembership.role === 'owner') {
      throw new ForbiddenException(
        'The organization owner role cannot be changed',
      );
    }

    /*
     * Avoid an unnecessary database write and audit
     * record when the requested role is already assigned.
     */
    if (targetMembership.role === role) {
      return targetMembership;
    }

    const previousRole =
      targetMembership.role;

    targetMembership.role = role;

    await targetMembership.save();

    /*
     * Store the role transition in the audit trail.
     */
    await this.auditService.log({
      organizationId,
      userId: currentUserId,
      action: 'CHANGE_ROLE',
      entity: 'OrganizationMember',
      entityId:
        targetMembership._id.toString(),
      metadata: {
        memberUserId:
          targetMembership.userId.toString(),
        previousRole,
        newRole: role,
      },
    });

    return targetMembership;
  }

  /**
   * Removes a member from an organization.
   *
   * The controller restricts this operation to owner/admin,
   * while the service independently protects the owner
   * membership from deletion.
   */
  async removeMember(
    organizationId: string,
    currentUserId: string,
    memberId: string,
  ) {
    const organizationObjectId =
      new Types.ObjectId(organizationId);

    const currentUserObjectId =
      new Types.ObjectId(currentUserId);

    /*
     * Confirm that the requester belongs to the
     * organization before performing the destructive action.
     */
    const currentMembership =
      await this.memberModel.findOne({
        organizationId: organizationObjectId,
        userId: currentUserObjectId,
      });

    if (!currentMembership) {
      throw new NotFoundException(
        'Organization not found',
      );
    }

    /*
     * Find the target membership while keeping the query
     * scoped to the organization.
     */
    const membership =
      await this.memberModel
        .findOne({
          _id: new Types.ObjectId(
            memberId,
          ),
          organizationId:
            organizationObjectId,
        })
        .exec();

    if (!membership) {
      throw new NotFoundException(
        'Member not found',
      );
    }

    /*
     * The organization owner cannot be removed through
     * normal member management.
     */
    if (membership.role === 'owner') {
      throw new ForbiddenException(
        'The organization owner cannot be removed',
      );
    }

    /*
     * Delete only the membership record. The actual User
     * account remains intact and can belong to other
     * organizations.
     */
    await this.memberModel
      .deleteOne({
        _id: membership._id,
        organizationId:
          organizationObjectId,
      })
      .exec();

    /*
     * Record the removal before returning success.
     */
    await this.auditService.log({
      organizationId,
      userId: currentUserId,
      action: 'REMOVE_MEMBER',
      entity: 'OrganizationMember',
      entityId:
        membership._id.toString(),
      metadata: {
        removedUserId:
          membership.userId.toString(),
        removedRole:
          membership.role,
      },
    });

    return {
      success: true,
      message:
        'Member removed successfully',
    };
  }

  /**
   * Finds the membership record for a specific user
   * inside a specific organization.
   *
   * This helper is used by authorization and organization
   * membership-related logic.
   */
  async findMembership(
    organizationId: string,
    userId: string,
  ) {
    return this.memberModel
      .findOne({
        organizationId:
          new Types.ObjectId(
            organizationId,
          ),
        userId:
          new Types.ObjectId(userId),
      })
      .exec();
  }
}