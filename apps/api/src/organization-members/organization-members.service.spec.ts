import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { vi } from 'vitest';

import { OrganizationMembersService } from './organization-members.service.js';
import { OrganizationMember } from './schemas/organization-member.schema.js';
import { User } from '../users/schemas/user.schema.js';
import { AuditService } from '../audit/audit.service.js';

describe('OrganizationMembersService', () => {
  let service: OrganizationMembersService;

  const memberModel = {
    findOne: vi.fn(),
    aggregate: vi.fn(),
    create: vi.fn(),
    deleteOne: vi.fn(),
  };

  const userModel = {
    findOne: vi.fn(),
  };

  const auditService = {
    log: vi.fn(),
  };

  const organizationId = '507f1f77bcf86cd799439011';
  const currentUserId = '507f1f77bcf86cd799439012';
  const targetUserId = '507f1f77bcf86cd799439013';
  const memberId = '507f1f77bcf86cd799439014';

  const requesterMembership = {
    _id: 'requester-membership',
    organizationId,
    userId: currentUserId,
    role: 'admin',
  };

  const targetMembership = {
    _id: memberId,
    organizationId,
    userId: targetUserId,
    role: 'member',
    save: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationMembersService,
        {
          provide: getModelToken(OrganizationMember.name),
          useValue: memberModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: userModel,
        },
        {
          provide: AuditService,
          useValue: auditService,
        },
      ],
    }).compile();

    service = module.get<OrganizationMembersService>(
      OrganizationMembersService,
    );

    auditService.log.mockResolvedValue({});
    targetMembership.save.mockResolvedValue(targetMembership);
  });

  function queryResult<T>(value: T) {
    return {
      exec: vi.fn().mockResolvedValue(value),
    };
  }

  describe('should be defined', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should reject users who are not members of the organization', async () => {
      // findAll() directly awaits findOne(), so this must be
      // a resolved value rather than a query object.
      memberModel.findOne.mockResolvedValue(null);

      await expect(
        service.findAll(organizationId, currentUserId, { page: 1, limit: 10 }),
      ).rejects.toThrow(new NotFoundException('Organization not found'));

      expect(memberModel.findOne).toHaveBeenCalled();
      expect(memberModel.aggregate).not.toHaveBeenCalled();
    });

    it('should return paginated members for the organization', async () => {
      memberModel.findOne.mockResolvedValue(requesterMembership);

      memberModel.aggregate.mockResolvedValue([
        {
          items: [
            {
              _id: memberId,
              role: 'member',
              user: {
                name: 'John Doe',
                email: 'john@example.com',
              },
            },
          ],
          metadata: [{ total: 1 }],
        },
      ]);

      const result = await service.findAll(organizationId, currentUserId, {
        page: 1,
        limit: 10,
      });

      expect(result).toEqual({
        items: [
          {
            _id: memberId,
            role: 'member',
            user: {
              name: 'John Doe',
              email: 'john@example.com',
            },
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });

      expect(memberModel.aggregate).toHaveBeenCalledTimes(1);
    });

    it('should apply pagination correctly', async () => {
      memberModel.findOne.mockResolvedValue(requesterMembership);

      memberModel.aggregate.mockResolvedValue([
        {
          items: [],
          metadata: [{ total: 25 }],
        },
      ]);

      const result = await service.findAll(organizationId, currentUserId, {
        page: 3,
        limit: 10,
      });

      expect(result.pagination).toEqual({
        page: 3,
        limit: 10,
        total: 25,
        totalPages: 3,
      });

      const pipeline = memberModel.aggregate.mock.calls[0][0];

      const facetStage = pipeline.find((stage: any) => stage.$facet);

      expect(facetStage.$facet.items).toContainEqual({
        $skip: 20,
      });

      expect(facetStage.$facet.items).toContainEqual({
        $limit: 10,
      });
    });

    it('should filter members by role', async () => {
      memberModel.findOne.mockResolvedValue(requesterMembership);

      memberModel.aggregate.mockResolvedValue([
        {
          items: [],
          metadata: [],
        },
      ]);

      await service.findAll(organizationId, currentUserId, {
        page: 1,
        limit: 10,
        role: 'member',
      });

      const pipeline = memberModel.aggregate.mock.calls[0][0];

      expect(pipeline).toContainEqual({
        $match: {
          organizationId: expect.anything(),
          role: 'member',
        },
      });
    });

    it('should add a case-insensitive escaped search filter', async () => {
      memberModel.findOne.mockResolvedValue(requesterMembership);

      memberModel.aggregate.mockResolvedValue([
        {
          items: [],
          metadata: [],
        },
      ]);

      await service.findAll(organizationId, currentUserId, {
        page: 1,
        limit: 10,
        search: 'john.test',
      });

      const pipeline = memberModel.aggregate.mock.calls[0][0];

      const searchStage = pipeline.find((stage: any) => stage.$match?.$or);

      expect(searchStage).toBeDefined();

      expect(
        searchStage.$match.$or[0].$or ?? searchStage.$match.$or,
      ).toBeDefined();
    });

    it('should trim search input before building the regex', async () => {
      memberModel.findOne.mockResolvedValue(requesterMembership);

      memberModel.aggregate.mockResolvedValue([
        {
          items: [],
          metadata: [],
        },
      ]);

      await service.findAll(organizationId, currentUserId, {
        page: 1,
        limit: 10,
        search: '  john  ',
      });

      const pipeline = memberModel.aggregate.mock.calls[0][0];

      const searchStage = pipeline.find((stage: any) => stage.$match?.$or);

      expect(searchStage).toBeDefined();

      expect(searchStage.$match.$or[0]['user.name']).toEqual(/john/i);

      expect(searchStage.$match.$or[1]['user.email']).toEqual(/john/i);
    });

    it('should sort by user name ascending', async () => {
      memberModel.findOne.mockResolvedValue(requesterMembership);

      memberModel.aggregate.mockResolvedValue([
        {
          items: [],
          metadata: [],
        },
      ]);

      await service.findAll(organizationId, currentUserId, {
        page: 1,
        limit: 10,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      const pipeline = memberModel.aggregate.mock.calls[0][0];

      expect(pipeline).toContainEqual({
        $sort: {
          'user.name': 1,
        },
      });
    });

    it('should sort by email descending', async () => {
      memberModel.findOne.mockResolvedValue(requesterMembership);

      memberModel.aggregate.mockResolvedValue([
        {
          items: [],
          metadata: [],
        },
      ]);

      await service.findAll(organizationId, currentUserId, {
        page: 1,
        limit: 10,
        sortBy: 'email',
        sortOrder: 'desc',
      });

      const pipeline = memberModel.aggregate.mock.calls[0][0];

      expect(pipeline).toContainEqual({
        $sort: {
          'user.email': -1,
        },
      });
    });

    it('should sort by role ascending', async () => {
      memberModel.findOne.mockResolvedValue(requesterMembership);

      memberModel.aggregate.mockResolvedValue([
        {
          items: [],
          metadata: [],
        },
      ]);

      await service.findAll(organizationId, currentUserId, {
        page: 1,
        limit: 10,
        sortBy: 'role',
        sortOrder: 'asc',
      });

      const pipeline = memberModel.aggregate.mock.calls[0][0];

      expect(pipeline).toContainEqual({
        $sort: {
          role: 1,
        },
      });
    });

    it('should default sorting to createdAt descending', async () => {
      memberModel.findOne.mockResolvedValue(requesterMembership);

      memberModel.aggregate.mockResolvedValue([
        {
          items: [],
          metadata: [],
        },
      ]);

      await service.findAll(organizationId, currentUserId, {
        page: 1,
        limit: 10,
      });

      const pipeline = memberModel.aggregate.mock.calls[0][0];

      expect(pipeline).toContainEqual({
        $sort: {
          createdAt: -1,
        },
      });
    });

    it('should return zero totals when aggregation metadata is empty', async () => {
      memberModel.findOne.mockResolvedValue(requesterMembership);

      memberModel.aggregate.mockResolvedValue([
        {
          items: [],
          metadata: [],
        },
      ]);

      const result = await service.findAll(organizationId, currentUserId, {
        page: 1,
        limit: 10,
      });

      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      });
    });
  });

  describe('addMember', () => {
    it('should reject a requester who is not a member', async () => {
      memberModel.findOne.mockResolvedValue(null);

      await expect(
        service.addMember(
          organizationId,
          currentUserId,
          'john@example.com',
          'member',
        ),
      ).rejects.toThrow(new NotFoundException('Organization not found'));

      expect(userModel.findOne).not.toHaveBeenCalled();
    });

    it('should reject when the target user does not exist', async () => {
      // First findOne = requester membership.
      memberModel.findOne.mockResolvedValue(requesterMembership);

      userModel.findOne.mockReturnValue(queryResult(null));

      await expect(
        service.addMember(
          organizationId,
          currentUserId,
          'missing@example.com',
          'member',
        ),
      ).rejects.toThrow(new NotFoundException('User not found'));
    });

    it('should reject duplicate membership', async () => {
      memberModel.findOne
        .mockResolvedValueOnce(requesterMembership)
        .mockResolvedValueOnce(targetMembership);

      userModel.findOne.mockReturnValue(
        queryResult({
          _id: targetUserId,
          email: 'john@example.com',
        }),
      );

      await expect(
        service.addMember(
          organizationId,
          currentUserId,
          'john@example.com',
          'member',
        ),
      ).rejects.toThrow(
        new ConflictException('User is already a member of this organization'),
      );

      expect(memberModel.create).not.toHaveBeenCalled();
    });

    it('should create membership and write an audit log', async () => {
      memberModel.findOne
        .mockResolvedValueOnce(requesterMembership)
        .mockResolvedValueOnce(null);

      userModel.findOne.mockReturnValue(
        queryResult({
          _id: targetUserId,
          email: 'john@example.com',
        }),
      );

      const createdMembership = {
        _id: memberId,
        organizationId,
        userId: targetUserId,
        role: 'member',
      };

      memberModel.create.mockResolvedValue(createdMembership);

      const result = await service.addMember(
        organizationId,
        currentUserId,
        ' JOHN@EXAMPLE.COM ',
        'member',
      );

      expect(result).toEqual(createdMembership);

      expect(memberModel.create).toHaveBeenCalled();

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId,
          userId: currentUserId,
          action: 'ADD_MEMBER',
        }),
      );
    });
  });

  describe('updateMemberRole', () => {
    it('should reject a requester who is not a member', async () => {
      memberModel.findOne.mockResolvedValue(null);

      await expect(
        service.updateMemberRole(
          organizationId,
          currentUserId,
          targetUserId,
          'admin',
        ),
      ).rejects.toThrow(new NotFoundException('Organization not found'));
    });

    it('should reject a target member from another organization', async () => {
      memberModel.findOne
        .mockResolvedValueOnce(requesterMembership)
        .mockResolvedValueOnce(null);

      await expect(
        service.updateMemberRole(
          organizationId,
          currentUserId,
          targetUserId,
          'admin',
        ),
      ).rejects.toThrow(new NotFoundException('Member not found'));
    });

    it('should prevent changing the owner role', async () => {
      memberModel.findOne
        .mockResolvedValueOnce(requesterMembership)
        .mockResolvedValueOnce({
          ...targetMembership,
          role: 'owner',
          save: vi.fn(),
        });

      await expect(
        service.updateMemberRole(
          organizationId,
          currentUserId,
          targetUserId,
          'member',
        ),
      ).rejects.toThrow(
        new ForbiddenException('The organization owner role cannot be changed'),
      );
    });

    it('should return immediately when the role is unchanged', async () => {
      const member = {
        ...targetMembership,
        role: 'member',
        save: vi.fn(),
      };

      memberModel.findOne
        .mockResolvedValueOnce(requesterMembership)
        .mockResolvedValueOnce(member);

      const result = await service.updateMemberRole(
        organizationId,
        currentUserId,
        targetUserId,
        'member',
      );

      expect(result).toBe(member);
      expect(member.save).not.toHaveBeenCalled();
      expect(auditService.log).not.toHaveBeenCalled();
    });

    it('should update the role and write an audit log', async () => {
      const save = vi.fn().mockResolvedValue(undefined);

      const member = {
        ...targetMembership,
        role: 'member',
        save,
      };

      memberModel.findOne
        .mockResolvedValueOnce(requesterMembership)
        .mockResolvedValueOnce(member);

      const result = await service.updateMemberRole(
        organizationId,
        currentUserId,
        targetUserId,
        'admin',
      );

      expect(member.role).toBe('admin');
      expect(save).toHaveBeenCalledTimes(1);
      expect(result).toBe(member);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId,
          userId: currentUserId,
          action: 'CHANGE_ROLE',
        }),
      );
    });
  });

  describe('removeMember', () => {
    it('should reject a requester who is not a member', async () => {
      memberModel.findOne.mockResolvedValue(null);

      await expect(
        service.removeMember(organizationId, currentUserId, targetUserId),
      ).rejects.toThrow(new NotFoundException('Organization not found'));
    });

    it('should reject when the target member does not exist', async () => {
      memberModel.findOne
        .mockResolvedValueOnce(requesterMembership)
        .mockReturnValueOnce(queryResult(null));

      await expect(
        service.removeMember(organizationId, currentUserId, targetUserId),
      ).rejects.toThrow(new NotFoundException('Member not found'));
    });

    it('should prevent removing the organization owner', async () => {
      const ownerMembership = {
        ...targetMembership,
        role: 'owner',
      };

      memberModel.findOne
        .mockResolvedValueOnce(requesterMembership)
        .mockReturnValueOnce(queryResult(ownerMembership));

      await expect(
        service.removeMember(organizationId, currentUserId, targetUserId),
      ).rejects.toThrow(
        new ForbiddenException('The organization owner cannot be removed'),
      );
    });

    it('should remove a member and write an audit log', async () => {
      const member = {
        ...targetMembership,
        role: 'member',
      };

      memberModel.findOne
        .mockImplementationOnce(() => requesterMembership)
        .mockImplementationOnce(() => queryResult(member));

      memberModel.deleteOne.mockReturnValueOnce(queryResult(undefined));

      const result = await service.removeMember(
        organizationId,
        currentUserId,
        targetUserId,
      );

      expect(memberModel.deleteOne).toHaveBeenCalledTimes(1);

      expect(memberModel.deleteOne).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: member._id,
        }),
      );

      expect(result).toEqual({
        success: true,
        message: 'Member removed successfully',
      });

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId,
          userId: currentUserId,
          action: 'REMOVE_MEMBER',
          entity: 'OrganizationMember',
          entityId: member._id.toString(),
          metadata: {
            removedUserId: member.userId.toString(),
            removedRole: 'member',
          },
        }),
      );
    });
  });

  describe('findMembership', () => {
    it('should find membership by organization and user', async () => {
      memberModel.findOne.mockReturnValue(queryResult(requesterMembership));

      const result = await service.findMembership(
        organizationId,
        currentUserId,
      );

      expect(result).toBe(requesterMembership);

      expect(memberModel.findOne).toHaveBeenCalledWith({
        organizationId: expect.anything(),
        userId: expect.anything(),
      });
    });

    it('should return null when membership does not exist', async () => {
      memberModel.findOne.mockReturnValue(queryResult(null));

      const result = await service.findMembership(
        organizationId,
        currentUserId,
      );

      expect(result).toBeNull();
    });
  });
});
