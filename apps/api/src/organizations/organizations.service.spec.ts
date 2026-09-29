import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';

import { OrganizationsService } from './organizations.service.js';
import {
  Organization,
  OrganizationDocument,
} from './schemas/organization.schema.js';
import {
  OrganizationMember,
  OrganizationMemberDocument,
} from '../organization-members/schemas/organization-member.schema.js';
import { AuditService } from '../audit/audit.service.js';
import { OrganizationQueryDto } from './dto/organization-query.dto.js';

describe('OrganizationsService', () => {
  let service: OrganizationsService;

  const organizationId = new Types.ObjectId();
  const ownerId = new Types.ObjectId();
  const anotherUserId = new Types.ObjectId();

  const organization = {
    _id: organizationId,
    name: 'Test Organization',
    slug: 'test-organization',
    ownerId,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const membership = {
    _id: new Types.ObjectId(),
    organizationId,
    userId: ownerId,
    role: 'owner',
  };

  const organizationModel = Object.assign(
    vi.fn(),
    {
      find: vi.fn(),
      countDocuments: vi.fn(),
      findById: vi.fn(),
      findOneAndUpdate: vi.fn(),
      findOneAndDelete: vi.fn(),
    },
  );

  const organizationMemberModel = {
    distinct: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
  };

  const auditService = {
    log: vi.fn(),
  };

  function queryResult<T>(value: T) {
    return {
      exec: vi.fn().mockResolvedValue(value),
    };
  }

  function createOrganizationConstructor(
    save: ReturnType<typeof vi.fn>,
    captureData?: (
      data: Record<string, unknown>,
    ) => void,
  ) {
    return function (
      this: Record<string, unknown>,
      data: Record<string, unknown>,
    ) {
      captureData?.(data);
      this.save = save;
    };
  }

  beforeEach(async () => {
    vi.clearAllMocks();

    organizationModel.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: getModelToken(Organization.name),
          useValue: organizationModel,
        },
        {
          provide: getModelToken(OrganizationMember.name),
          useValue: organizationMemberModel,
        },
        {
          provide: AuditService,
          useValue: auditService,
        },
      ],
    }).compile();

    service = module.get<OrganizationsService>(
      OrganizationsService,
    );
  });

  describe('create', () => {
    it('should create an organization, owner membership, and audit log', async () => {
      const save = vi.fn().mockResolvedValue(organization);

      organizationModel.mockImplementationOnce(
        createOrganizationConstructor(save),
      );

      organizationMemberModel.create.mockResolvedValue(
        membership,
      );

      auditService.log.mockResolvedValue(undefined);

      const result = await service.create(
        '  Test Organization  ',
        '  TEST-ORGANIZATION  ',
        ownerId.toString(),
      );

      expect(result).toEqual(organization);

      expect(
        organizationMemberModel.create,
      ).toHaveBeenCalledWith({
        organizationId: organization._id,
        userId: ownerId,
        role: 'owner',
      });

      expect(auditService.log).toHaveBeenCalledWith({
        organizationId: organization._id.toString(),
        userId: ownerId.toString(),
        action: 'CREATE',
        entity: 'Organization',
        entityId: organization._id.toString(),
        metadata: {
          name: organization.name,
          slug: organization.slug,
        },
      });
    });

    it('should trim the organization name and normalize the slug', async () => {
      const save = vi.fn().mockResolvedValue(organization);

      let constructorData:
        | Record<string, unknown>
        | undefined;

      organizationModel.mockImplementationOnce(
        createOrganizationConstructor(
          save,
          (data) => {
            constructorData = data;
          },
        ),
      );

      organizationMemberModel.create.mockResolvedValue(
        membership,
      );

      auditService.log.mockResolvedValue(undefined);

      await service.create(
        '   My Company   ',
        '   MY-COMPANY   ',
        ownerId.toString(),
      );

      expect(constructorData).toEqual({
        name: 'My Company',
        slug: 'my-company',
        ownerId,
      });
    });

    it('should throw ConflictException when the slug already exists', async () => {
      const save = vi.fn().mockRejectedValue({
        code: 11000,
      });

      organizationModel.mockImplementationOnce(
        createOrganizationConstructor(save),
      );

      await expect(
        service.create(
          'Test Organization',
          'test-organization',
          ownerId.toString(),
        ),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(
        organizationMemberModel.create,
      ).not.toHaveBeenCalled();

      expect(auditService.log).not.toHaveBeenCalled();
    });

    it('should rethrow non-duplicate errors', async () => {
      const error = new Error(
        'Database connection failed',
      );

      const save = vi.fn().mockRejectedValue(error);

      organizationModel.mockImplementationOnce(
        createOrganizationConstructor(save),
      );

      await expect(
        service.create(
          'Test Organization',
          'test-organization',
          ownerId.toString(),
        ),
      ).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('findAll', () => {
    it('should return empty results when the user belongs to no organizations', async () => {
      organizationMemberModel.distinct.mockResolvedValue([]);

      const query: OrganizationQueryDto = {
        page: 1,
        limit: 10,
      };

      const result = await service.findAll(
        ownerId.toString(),
        query,
      );

      expect(
        organizationMemberModel.distinct,
      ).toHaveBeenCalledWith(
        'organizationId',
        {
          userId: ownerId,
        },
      );

      expect(result).toEqual({
        items: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      });
    });

    it('should return paginated organizations', async () => {
      const items = [organization];

      organizationMemberModel.distinct.mockResolvedValue([
        organizationId,
      ]);

      organizationModel.find.mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(items),
      });

      organizationModel.countDocuments.mockResolvedValue(15);

      const query: OrganizationQueryDto = {
        page: 2,
        limit: 10,
      };

      const result = await service.findAll(
        ownerId.toString(),
        query,
      );

      expect(result).toEqual({
        items,
        pagination: {
          page: 2,
          limit: 10,
          total: 15,
          totalPages: 2,
        },
      });
    });

    it('should filter organizations by status', async () => {
      organizationMemberModel.distinct.mockResolvedValue([
        organizationId,
      ]);

      organizationModel.find.mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([organization]),
      });

      organizationModel.countDocuments.mockResolvedValue(1);

      const query: OrganizationQueryDto = {
        page: 1,
        limit: 10,
        status: 'active',
      };

      await service.findAll(
        ownerId.toString(),
        query,
      );

      expect(organizationModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
        }),
      );

      expect(
        organizationModel.countDocuments,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
        }),
      );
    });

    it('should search organizations by name or slug', async () => {
      organizationMemberModel.distinct.mockResolvedValue([
        organizationId,
      ]);

      organizationModel.find.mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([organization]),
      });

      organizationModel.countDocuments.mockResolvedValue(1);

      const query: OrganizationQueryDto = {
        page: 1,
        limit: 10,
        search: 'test.company',
      };

      await service.findAll(
        ownerId.toString(),
        query,
      );

      const filter =
        organizationModel.find.mock.calls[0][0];

      expect(filter.$or).toHaveLength(2);

      expect(filter.$or[0].name).toEqual(
        /test\.company/i,
      );

      expect(filter.$or[1].slug).toEqual(
        /test\.company/i,
      );
    });

    it('should escape special regex characters in search', async () => {
      organizationMemberModel.distinct.mockResolvedValue([
        organizationId,
      ]);

      organizationModel.find.mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([]),
      });

      organizationModel.countDocuments.mockResolvedValue(0);

      const query: OrganizationQueryDto = {
        page: 1,
        limit: 10,
        search: 'test.*company',
      };

      await service.findAll(
        ownerId.toString(),
        query,
      );

      const filter =
        organizationModel.find.mock.calls[0][0];

      expect(filter.$or[0].name.source).toBe(
        'test\\.\\*company',
      );

      expect(filter.$or[1].slug.source).toBe(
        'test\\.\\*company',
      );
    });

    it('should sort organizations ascending when requested', async () => {
      organizationMemberModel.distinct.mockResolvedValue([
        organizationId,
      ]);

      const sort = vi.fn().mockReturnThis();

      organizationModel.find.mockReturnValue({
        sort,
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([organization]),
      });

      organizationModel.countDocuments.mockResolvedValue(1);

      const query: OrganizationQueryDto = {
        page: 1,
        limit: 10,
        sortBy: 'name',
        sortOrder: 'asc',
      };

      await service.findAll(
        ownerId.toString(),
        query,
      );

      expect(sort).toHaveBeenCalledWith({
        name: 1,
      });
    });

    it('should sort organizations descending by default', async () => {
      organizationMemberModel.distinct.mockResolvedValue([
        organizationId,
      ]);

      const sort = vi.fn().mockReturnThis();

      organizationModel.find.mockReturnValue({
        sort,
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([organization]),
      });

      organizationModel.countDocuments.mockResolvedValue(1);

      const query: OrganizationQueryDto = {
        page: 1,
        limit: 10,
      };

      await service.findAll(
        ownerId.toString(),
        query,
      );

      expect(sort).toHaveBeenCalledWith({
        createdAt: -1,
      });
    });

    it('should calculate total pages correctly', async () => {
      organizationMemberModel.distinct.mockResolvedValue([
        organizationId,
      ]);

      organizationModel.find.mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([]),
      });

      organizationModel.countDocuments.mockResolvedValue(21);

      const query: OrganizationQueryDto = {
        page: 2,
        limit: 10,
      };

      const result = await service.findAll(
        ownerId.toString(),
        query,
      );

      expect(
        result.pagination.totalPages,
      ).toBe(3);
    });
  });

  describe('findOne', () => {
    it('should return an organization when the user is a member', async () => {
      organizationMemberModel.findOne.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue({
          _id: membership._id,
        }),
      });

      organizationModel.findById.mockReturnValue(
        queryResult(organization),
      );

      const result = await service.findOne(
        organizationId.toString(),
        ownerId.toString(),
      );

      expect(result).toEqual(organization);

      expect(
        organizationMemberModel.findOne,
      ).toHaveBeenCalledWith({
        organizationId,
        userId: ownerId,
      });

      expect(
        organizationModel.findById,
      ).toHaveBeenCalledWith(
        organizationId.toString(),
      );
    });

    it('should throw NotFoundException when the user is not a member', async () => {
      organizationMemberModel.findOne.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(
        service.findOne(
          organizationId.toString(),
          anotherUserId.toString(),
        ),
      ).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(
        organizationModel.findById,
      ).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when membership exists but organization does not', async () => {
      organizationMemberModel.findOne.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue({
          _id: membership._id,
        }),
      });

      organizationModel.findById.mockReturnValue(
        queryResult(null),
      );

      await expect(
        service.findOne(
          organizationId.toString(),
          ownerId.toString(),
        ),
      ).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an organization and write an audit log', async () => {
      const updatedOrganization = {
        ...organization,
        name: 'Updated Organization',
        slug: 'updated-organization',
      };

      organizationModel.findOneAndUpdate.mockReturnValue(
        queryResult(updatedOrganization),
      );

      auditService.log.mockResolvedValue(undefined);

      const result = await service.update(
        organizationId.toString(),
        ownerId.toString(),
        {
          name: '  Updated Organization  ',
          slug: '  UPDATED-ORGANIZATION  ',
        },
      );

      expect(result).toEqual(updatedOrganization);

      expect(
        organizationModel.findOneAndUpdate,
      ).toHaveBeenCalledWith(
        {
          _id: organizationId.toString(),
          ownerId,
        },
        {
          $set: {
            name: 'Updated Organization',
            slug: 'updated-organization',
          },
        },
        {
          new: true,
          runValidators: true,
        },
      );

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId:
            organizationId.toString(),
          userId: ownerId.toString(),
          action: 'UPDATE',
          entity: 'Organization',
          entityId: organizationId.toString(),
          metadata: {
            updatedFields: [
              'name',
              'slug',
            ],
          },
        }),
      );
    });

    it('should update only the supplied fields', async () => {
      organizationModel.findOneAndUpdate.mockReturnValue(
        queryResult(organization),
      );

      auditService.log.mockResolvedValue(undefined);

      await service.update(
        organizationId.toString(),
        ownerId.toString(),
        {
          status: 'suspended',
        },
      );

      expect(
        organizationModel.findOneAndUpdate,
      ).toHaveBeenCalledWith(
        {
          _id: organizationId.toString(),
          ownerId,
        },
        {
          $set: {
            status: 'suspended',
          },
        },
        {
          new: true,
          runValidators: true,
        },
      );
    });

    it('should throw NotFoundException when the organization does not exist', async () => {
      organizationModel.findOneAndUpdate.mockReturnValue(
        queryResult(null),
      );

      await expect(
        service.update(
          organizationId.toString(),
          ownerId.toString(),
          {
            name: 'Updated',
          },
        ),
      ).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(
        auditService.log,
      ).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete an organization and write an audit log', async () => {
      organizationModel.findOneAndDelete.mockReturnValue(
        queryResult(organization),
      );

      auditService.log.mockResolvedValue(undefined);

      const result = await service.remove(
        organizationId.toString(),
        ownerId.toString(),
      );

      expect(result).toEqual({
        success: true,
        message:
          'Organization deleted successfully',
      });

      expect(
        organizationModel.findOneAndDelete,
      ).toHaveBeenCalledWith({
        _id: organizationId.toString(),
        ownerId,
      });

      expect(auditService.log).toHaveBeenCalledWith({
        organizationId:
          organizationId.toString(),
        userId: ownerId.toString(),
        action: 'DELETE',
        entity: 'Organization',
        entityId: organizationId.toString(),
        metadata: {
          name: organization.name,
          slug: organization.slug,
        },
      });
    });

    it('should throw NotFoundException when the organization does not exist', async () => {
      organizationModel.findOneAndDelete.mockReturnValue(
        queryResult(null),
      );

      await expect(
        service.remove(
          organizationId.toString(),
          ownerId.toString(),
        ),
      ).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(
        auditService.log,
      ).not.toHaveBeenCalled();
    });
  });
});