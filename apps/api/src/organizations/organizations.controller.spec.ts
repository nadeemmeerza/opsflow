import { Test, TestingModule } from '@nestjs/testing';

import { OrganizationsController } from './organizations.controller.js';
import { OrganizationsService } from './organizations.service.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OrganizationMembershipGuard } from '../organization-members/guards/organization-membership.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';

describe('OrganizationsController', () => {
  let controller: OrganizationsController;

  const organizationService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [
        {
          provide: OrganizationsService,
          useValue: organizationService,
        },
      ],
    })
      // Unit tests should not initialize the real authentication/
      // authorization infrastructure. Each guard is replaced with a
      // simple allow-all mock so controller methods can be tested directly.
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: vi.fn().mockReturnValue(true),
      })
      .overrideGuard(OrganizationMembershipGuard)
      .useValue({
        canActivate: vi.fn().mockReturnValue(true),
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: vi.fn().mockReturnValue(true),
      })
      .compile();

    controller = module.get<OrganizationsController>(
      OrganizationsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an organization for the current user', async () => {
      const dto = {
        name: 'Acme Inc.',
        slug: 'acme-inc',
      };

      const user = {
        userId: 'user-123',
         email: 'john@example.com',
      };

      const createdOrganization = {
        id: 'org-123',
        name: 'Acme Inc.',
        slug: 'acme-inc',
      };

      organizationService.create.mockResolvedValue(
        createdOrganization,
      );

      const result = await controller.create(dto, user);

      expect(organizationService.create).toHaveBeenCalledWith(
        dto.name,
        dto.slug,
        user.userId,
      );

      expect(result).toEqual(createdOrganization);
    });
  });

  describe('findAll', () => {
    it('should return organizations for the current user', async () => {
      const user = {
        userId: 'user-123',
         email: 'john@example.com',
      };

      const query = {
        search: 'acme',
      };

      const organizations = [
        {
          id: 'org-123',
          name: 'Acme Inc.',
          slug: 'acme-inc',
        },
      ];

      organizationService.findAll.mockResolvedValue(
        organizations,
      );

      const result = await controller.findAll(user, query);

      expect(organizationService.findAll).toHaveBeenCalledWith(
        user.userId,
        query,
      );

      expect(result).toEqual(organizations);
    });
  });

  describe('testError', () => {
    it('should throw the expected NotFoundException', () => {
      expect(() => controller.testError()).toThrow(
        'Test organization not found',
      );
    });
  });

  describe('findOne', () => {
    it('should return an organization for the current user', async () => {
      const organizationId = '507f1f77bcf86cd799439011';

      const user = {
        userId: 'user-123',
         email: 'john@example.com',
      };

      const organization = {
        id: organizationId,
        name: 'Acme Inc.',
        slug: 'acme-inc',
      };

      organizationService.findOne.mockResolvedValue(
        organization,
      );

      const result = await controller.findOne(
        organizationId,
        user,
      );

      expect(organizationService.findOne).toHaveBeenCalledWith(
        organizationId,
        user.userId,
      );

      expect(result).toEqual(organization);
    });
  });

  describe('update', () => {
    it('should update an organization', async () => {
      const organizationId = '507f1f77bcf86cd799439011';

      const dto = {
        name: 'Updated Acme',
      };

      const user = {
        userId: 'user-123',
         email: 'john@example.com',
      };

      const updatedOrganization = {
        id: organizationId,
        name: 'Updated Acme',
        slug: 'acme-inc',
      };

      organizationService.update.mockResolvedValue(
        updatedOrganization,
      );

      const result = await controller.update(
        organizationId,
        dto,
        user,
      );

      expect(organizationService.update).toHaveBeenCalledWith(
        organizationId,
        user.userId,
        dto,
      );

      expect(result).toEqual(updatedOrganization);
    });
  });

  describe('remove', () => {
    it('should remove an organization', async () => {
      const organizationId = '507f1f77bcf86cd799439011';

      const user = {
        userId: 'user-123',
         email: 'john@example.com',
      };

      const deletedOrganization = {
        id: organizationId,
      };

      organizationService.remove.mockResolvedValue(
        deletedOrganization,
      );

      const result = await controller.remove(
        organizationId,
        user,
      );

      expect(organizationService.remove).toHaveBeenCalledWith(
        organizationId,
        user.userId,
      );

      expect(result).toEqual(deletedOrganization);
    });
  });
});
