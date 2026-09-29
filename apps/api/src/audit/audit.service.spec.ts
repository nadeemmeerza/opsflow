import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';

import { AuditService } from './audit.service.js';
import { AuditLog } from './schemas/audit-log.schema.js';

describe('AuditService', () => {
  let service: AuditService;
  let auditModel: any;

  const organizationId =
    new Types.ObjectId().toString();

  const userId =
    new Types.ObjectId().toString();

  const entityId =
    new Types.ObjectId().toString();

  /**
   * Creates the Mongoose query chain used by
   * findAll() and findByEntity().
   */
  const setupFindQuery = (result: unknown) => {
    const query = {
      populate: vi.fn(),
      sort: vi.fn(),
      exec: vi.fn(),
    };

    query.populate.mockReturnValue(query);
    query.sort.mockReturnValue(query);
    query.exec.mockResolvedValue(result);

    auditModel.find.mockReturnValue(query);

    return query;
  };

  beforeEach(async () => {
    auditModel = {
      create: vi.fn(),
      find: vi.fn(),
    };

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          AuditService,
          {
            provide: getModelToken(AuditLog.name),
            useValue: auditModel,
          },
        ],
      }).compile();

    service =
      module.get<AuditService>(
        AuditService,
      );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should create an audit log with ObjectId references', async () => {
      const auditLog = {
        _id: new Types.ObjectId(),
        action: 'CREATE',
        entity: 'Project',
      };

      auditModel.create.mockResolvedValue(
        auditLog,
      );

      const result = await service.log({
        organizationId,
        userId,
        action: 'CREATE',
        entity: 'Project',
        entityId,
        metadata: {
          name: 'OpsFlow',
        },
      });

      expect(result).toBe(auditLog);

      expect(auditModel.create)
        .toHaveBeenCalledWith({
          organizationId:
            new Types.ObjectId(
              organizationId,
            ),
          userId:
            new Types.ObjectId(userId),
          action: 'CREATE',
          entity: 'Project',
          entityId:
            new Types.ObjectId(entityId),
          metadata: {
            name: 'OpsFlow',
          },
        });
    });

    it('should use an empty metadata object when metadata is omitted', async () => {
      auditModel.create.mockResolvedValue(
        {},
      );

      await service.log({
        organizationId,
        userId,
        action: 'LOGIN',
        entity: 'User',
      });

      expect(auditModel.create)
        .toHaveBeenCalledWith({
          organizationId:
            new Types.ObjectId(
              organizationId,
            ),
          userId:
            new Types.ObjectId(userId),
          action: 'LOGIN',
          entity: 'User',
          entityId: null,
          metadata: {},
        });
    });

    it('should store a null entityId when entityId is explicitly null', async () => {
      auditModel.create.mockResolvedValue(
        {},
      );

      await service.log({
        organizationId,
        userId,
        action: 'ADD_MEMBER',
        entity: 'OrganizationMember',
        entityId: null,
      });

      expect(auditModel.create)
        .toHaveBeenCalledWith({
          organizationId:
            new Types.ObjectId(
              organizationId,
            ),
          userId:
            new Types.ObjectId(userId),
          action: 'ADD_MEMBER',
          entity: 'OrganizationMember',
          entityId: null,
          metadata: {},
        });
    });

    it('should preserve supplied metadata', async () => {
      auditModel.create.mockResolvedValue(
        {},
      );

      const metadata = {
        role: 'admin',
        previousRole: 'member',
        source: 'settings',
      };

      await service.log({
        organizationId,
        userId,
        action: 'CHANGE_ROLE',
        entity: 'OrganizationMember',
        entityId,
        metadata,
      });

      expect(auditModel.create)
        .toHaveBeenCalledWith({
          organizationId:
            new Types.ObjectId(
              organizationId,
            ),
          userId:
            new Types.ObjectId(userId),
          action: 'CHANGE_ROLE',
          entity: 'OrganizationMember',
          entityId:
            new Types.ObjectId(entityId),
          metadata,
        });
    });
  });

  describe('findAll', () => {
    it('should return organization audit logs', async () => {
      const logs = [
        {
          _id: new Types.ObjectId(),
          action: 'CREATE',
          entity: 'Project',
        },
        {
          _id: new Types.ObjectId(),
          action: 'UPDATE',
          entity: 'Task',
        },
      ];

      const query =
        setupFindQuery(logs);

      const result =
        await service.findAll(
          organizationId,
        );

      expect(result).toBe(logs);

      expect(auditModel.find)
        .toHaveBeenCalledWith({
          organizationId:
            new Types.ObjectId(
              organizationId,
            ),
        });

      expect(query.populate)
        .toHaveBeenCalledWith(
          'userId',
          'name email',
        );

      expect(query.sort)
        .toHaveBeenCalledWith({
          createdAt: -1,
        });

      expect(query.exec)
        .toHaveBeenCalledTimes(1);
    });

    it('should return an empty array when no audit logs exist', async () => {
      const query =
        setupFindQuery([]);

      const result =
        await service.findAll(
          organizationId,
        );

      expect(result).toEqual([]);

      expect(query.exec)
        .toHaveBeenCalledTimes(1);
    });
  });

  describe('findByEntity', () => {
    it('should return audit logs for a specific entity', async () => {
      const logs = [
        {
          _id: new Types.ObjectId(),
          action: 'CREATE',
          entity: 'Project',
          entityId:
            new Types.ObjectId(entityId),
        },
        {
          _id: new Types.ObjectId(),
          action: 'UPDATE',
          entity: 'Project',
          entityId:
            new Types.ObjectId(entityId),
        },
      ];

      const query =
        setupFindQuery(logs);

      const result =
        await service.findByEntity(
          organizationId,
          'Project',
          entityId,
        );

      expect(result).toBe(logs);

      expect(auditModel.find)
        .toHaveBeenCalledWith({
          organizationId:
            new Types.ObjectId(
              organizationId,
            ),
          entity: 'Project',
          entityId:
            new Types.ObjectId(entityId),
        });

      expect(query.populate)
        .toHaveBeenCalledWith(
          'userId',
          'name email',
        );

      expect(query.sort)
        .toHaveBeenCalledWith({
          createdAt: -1,
        });
    });

    it('should scope entity history to the organization', async () => {
      setupFindQuery([]);

      await service.findByEntity(
        organizationId,
        'Task',
        entityId,
      );

      const filter =
        auditModel.find.mock.calls[0][0];

      expect(filter.organizationId).toEqual(
        new Types.ObjectId(
          organizationId,
        ),
      );

      expect(filter.entity).toBe('Task');

      expect(filter.entityId).toEqual(
        new Types.ObjectId(entityId),
      );
    });

    it('should return an empty array when no entity history exists', async () => {
      const query =
        setupFindQuery([]);

      const result =
        await service.findByEntity(
          organizationId,
          'Customer',
          entityId,
        );

      expect(result).toEqual([]);

      expect(query.exec)
        .toHaveBeenCalledTimes(1);
    });
  });
});