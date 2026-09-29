import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';

import { TicketsService } from './tickets.service.js';
import { Ticket } from './schemas/ticket.schema.js';
import { Customer } from '../customers/schemas/customer.schema.js';
import { Project } from '../projects/schemas/project.schema.js';
import { OrganizationMember } from '../organization-members/schemas/organization-member.schema.js';
import { AuditService } from '../audit/audit.service.js';

describe('TicketsService', () => {
  let service: TicketsService;

  let ticketModel: any;
  let customerModel: any;
  let projectModel: any;
  let memberModel: any;
  let auditService: {
    log: ReturnType<typeof vi.fn>;
  };

  const organizationId = new Types.ObjectId().toString();
  const userId = new Types.ObjectId().toString();
  const customerId = new Types.ObjectId().toString();
  const projectId = new Types.ObjectId().toString();
  const assigneeId = new Types.ObjectId().toString();
  const ticketId = new Types.ObjectId().toString();

  /**
   * Creates the chain used by find(), including all three
   * population calls followed by sorting, pagination and exec.
   */
  const setupFindQuery = (items: unknown[]) => {
    const query = {
      populate: vi.fn(),
      sort: vi.fn(),
      skip: vi.fn(),
      limit: vi.fn(),
      exec: vi.fn(),
    };

    query.populate.mockReturnValue(query);
    query.sort.mockReturnValue(query);
    query.skip.mockReturnValue(query);
    query.limit.mockReturnValue(query);
    query.exec.mockResolvedValue(items);

    ticketModel.find.mockReturnValue(query);

    return query;
  };

  /**
   * Creates the chain used by findOne().
   */
  const setupFindOneQuery = (result: unknown) => {
    const query = {
      populate: vi.fn(),
      exec: vi.fn(),
    };

    query.populate.mockReturnValue(query);
    query.exec.mockResolvedValue(result);

    ticketModel.findOne.mockReturnValue(query);

    return query;
  };

  /**
   * Creates the chain used by findOneAndUpdate().
   */
  const setupUpdateQuery = (result: unknown) => {
    const query = {
      populate: vi.fn(),
      exec: vi.fn(),
    };

    query.populate.mockReturnValue(query);
    query.exec.mockResolvedValue(result);

    ticketModel.findOneAndUpdate.mockReturnValue(query);

    return query;
  };

  /**
   * Creates the chain used by findOneAndDelete().
   */
  const setupDeleteQuery = (result: unknown) => {
    const query = {
      exec: vi.fn(),
    };

    query.exec.mockResolvedValue(result);

    ticketModel.findOneAndDelete.mockReturnValue(query);

    return query;
  };

  beforeEach(async () => {
    ticketModel = {
      create: vi.fn(),
      find: vi.fn(),
      countDocuments: vi.fn(),
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
      findOneAndDelete: vi.fn(),
    };

    customerModel = {
      findOne: vi.fn(),
    };

    projectModel = {
      findOne: vi.fn(),
    };

    memberModel = {
      findOne: vi.fn(),
    };

    auditService = {
      log: vi.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: getModelToken(Ticket.name),
          useValue: ticketModel,
        },
        {
          provide: getModelToken(Customer.name),
          useValue: customerModel,
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

    service = module.get<TicketsService>(TicketsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a ticket with normalized values and defaults', async () => {
      const ticket = {
        _id: new Types.ObjectId(),
        title: 'Login problem',
        description: 'Unable to login',
        priority: 'medium',
        status: 'open',
      };

      customerModel.findOne.mockResolvedValue({
        _id: new Types.ObjectId(customerId),
      });

      ticketModel.create.mockResolvedValue(ticket);

      const result = await service.create(
        organizationId,
        userId,
        {
          title: '  Login problem  ',
          description: '  Unable to login  ',
          customerId,
        },
      );

      expect(result).toBe(ticket);

      expect(customerModel.findOne).toHaveBeenCalledWith({
        _id: new Types.ObjectId(customerId),
        organizationId: new Types.ObjectId(organizationId),
      });

      expect(ticketModel.create).toHaveBeenCalledWith({
        title: 'Login problem',
        description: 'Unable to login',
        organizationId: new Types.ObjectId(organizationId),
        customerId: new Types.ObjectId(customerId),
        projectId: null,
        assigneeId: null,
        createdBy: new Types.ObjectId(userId),
        status: 'open',
        priority: 'medium',
      });

      expect(auditService.log).toHaveBeenCalledWith({
        organizationId,
        userId,
        action: 'CREATE',
        entity: 'Ticket',
        entityId: ticket._id.toString(),
        metadata: {
          title: ticket.title,
          priority: ticket.priority,
          customerId,
        },
      });
    });

    it('should create a ticket with project and assignee', async () => {
      const ticket = {
        _id: new Types.ObjectId(),
        title: 'Deployment issue',
        priority: 'high',
      };

      customerModel.findOne.mockResolvedValue({
        _id: new Types.ObjectId(customerId),
      });

      projectModel.findOne.mockResolvedValue({
        _id: new Types.ObjectId(projectId),
      });

      memberModel.findOne.mockResolvedValue({
        _id: new Types.ObjectId(),
      });

      ticketModel.create.mockResolvedValue(ticket);

      await service.create(
        organizationId,
        userId,
        {
          title: 'Deployment issue',
          customerId,
          projectId,
          assigneeId,
          priority: 'high',
        },
      );

      expect(projectModel.findOne).toHaveBeenCalledWith({
        _id: new Types.ObjectId(projectId),
        organizationId: new Types.ObjectId(organizationId),
      });

      expect(memberModel.findOne).toHaveBeenCalledWith({
        organizationId: new Types.ObjectId(organizationId),
        userId: new Types.ObjectId(assigneeId),
      });

      expect(ticketModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: new Types.ObjectId(projectId),
          assigneeId: new Types.ObjectId(assigneeId),
          priority: 'high',
        }),
      );
    });

    it('should throw when customer does not belong to the organization', async () => {
      customerModel.findOne.mockResolvedValue(null);

      await expect(
        service.create(
          organizationId,
          userId,
          {
            title: 'Customer issue',
            customerId,
          },
        ),
      ).rejects.toThrow('Customer not found');

      expect(ticketModel.create).not.toHaveBeenCalled();
    });

    it('should throw when project does not belong to the organization', async () => {
      customerModel.findOne.mockResolvedValue({
        _id: new Types.ObjectId(customerId),
      });

      projectModel.findOne.mockResolvedValue(null);

      await expect(
        service.create(
          organizationId,
          userId,
          {
            title: 'Project issue',
            customerId,
            projectId,
          },
        ),
      ).rejects.toThrow('Project not found');

      expect(ticketModel.create).not.toHaveBeenCalled();
    });

    it('should throw when assignee is not an organization member', async () => {
      customerModel.findOne.mockResolvedValue({
        _id: new Types.ObjectId(customerId),
      });

      memberModel.findOne.mockResolvedValue(null);

      await expect(
        service.create(
          organizationId,
          userId,
          {
            title: 'Assignment issue',
            customerId,
            assigneeId,
          },
        ),
      ).rejects.toThrow(
        'Assignee is not a member of this organization',
      );

      expect(ticketModel.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated tickets', async () => {
      const items = [
        { _id: ticketId, title: 'Ticket 1' },
        { _id: new Types.ObjectId(), title: 'Ticket 2' },
      ];

      const query = setupFindQuery(items);
      ticketModel.countDocuments.mockResolvedValue(25);

      const result = await service.findAll(
        organizationId,
        {
          page: 2,
          limit: 10,
        } as any,
      );

      expect(result).toEqual({
        items,
        pagination: {
          page: 2,
          limit: 10,
          total: 25,
          totalPages: 3,
        },
      });

      expect(ticketModel.find).toHaveBeenCalledWith({
        organizationId: new Types.ObjectId(organizationId),
      });

      expect(query.sort).toHaveBeenCalledWith({
        createdAt: -1,
      });

      expect(query.skip).toHaveBeenCalledWith(10);
      expect(query.limit).toHaveBeenCalledWith(10);
    });

    it('should apply status and priority filters', async () => {
      setupFindQuery([]);
      ticketModel.countDocuments.mockResolvedValue(0);

      await service.findAll(
        organizationId,
        {
          status: 'in_progress',
          priority: 'high',
        } as any,
      );

      const filter = ticketModel.find.mock.calls[0][0];

      expect(filter.status).toBe('in_progress');
      expect(filter.priority).toBe('high');
    });

    it('should apply search to title and description', async () => {
      setupFindQuery([]);
      ticketModel.countDocuments.mockResolvedValue(0);

      await service.findAll(
        organizationId,
        {
          search: 'login',
        } as any,
      );

      const filter = ticketModel.find.mock.calls[0][0];

      expect(filter.$or[0].title).toEqual(/login/i);
      expect(filter.$or[1].description).toEqual(/login/i);
    });

    it('should escape special regex characters in search', async () => {
      setupFindQuery([]);
      ticketModel.countDocuments.mockResolvedValue(0);

      await service.findAll(
        organizationId,
        {
          search: 'ops.test',
        } as any,
      );

      const filter = ticketModel.find.mock.calls[0][0];

      expect(filter.$or[0].title).toEqual(
        /ops\.test/i,
      );
    });

    it('should ignore empty search values', async () => {
      setupFindQuery([]);
      ticketModel.countDocuments.mockResolvedValue(0);

      await service.findAll(
        organizationId,
        {
          search: '   ',
        } as any,
      );

      const filter = ticketModel.find.mock.calls[0][0];

      expect(filter.$or).toBeUndefined();
    });

    it('should support ascending sorting', async () => {
      const query = setupFindQuery([]);
      ticketModel.countDocuments.mockResolvedValue(0);

      await service.findAll(
        organizationId,
        {
          sortBy: 'priority',
          sortOrder: 'asc',
        } as any,
      );

      expect(query.sort).toHaveBeenCalledWith({
        priority: 1,
      });
    });

    it('should use default pagination values', async () => {
      const query = setupFindQuery([]);
      ticketModel.countDocuments.mockResolvedValue(0);

      await service.findAll(
        organizationId,
        {} as any,
      );

      expect(query.skip).toHaveBeenCalledWith(0);
      expect(query.limit).toHaveBeenCalledWith(10);
      expect(query.sort).toHaveBeenCalledWith({
        createdAt: -1,
      });
    });

    it('should populate customer, project and assignee', async () => {
      const query = setupFindQuery([]);
      ticketModel.countDocuments.mockResolvedValue(0);

      await service.findAll(
        organizationId,
        {} as any,
      );

      expect(query.populate).toHaveBeenNthCalledWith(
        1,
        'customerId',
        'name email phone company',
      );

      expect(query.populate).toHaveBeenNthCalledWith(
        2,
        'projectId',
        'name key status',
      );

      expect(query.populate).toHaveBeenNthCalledWith(
        3,
        'assigneeId',
        'name email status',
      );
    });
  });

  describe('findOne', () => {
    it('should return a ticket scoped to the organization', async () => {
      const ticket = {
        _id: new Types.ObjectId(ticketId),
        title: 'Login issue',
      };

      const query = setupFindOneQuery(ticket);

      const result = await service.findOne(
        organizationId,
        ticketId,
      );

      expect(result).toBe(ticket);

      expect(ticketModel.findOne).toHaveBeenCalledWith({
        _id: new Types.ObjectId(ticketId),
        organizationId: new Types.ObjectId(organizationId),
      });

      expect(query.populate).toHaveBeenCalledTimes(3);
    });

    it('should throw when ticket does not exist', async () => {
      setupFindOneQuery(null);

      await expect(
        service.findOne(
          organizationId,
          ticketId,
        ),
      ).rejects.toThrow('Ticket not found');
    });
  });

  describe('update', () => {
    it('should update and normalize ticket fields', async () => {
      const ticket = {
        _id: new Types.ObjectId(ticketId),
        title: 'Updated ticket',
      };

      const query = setupUpdateQuery(ticket);

      customerModel.findOne.mockResolvedValue({
        _id: new Types.ObjectId(customerId),
      });

      projectModel.findOne.mockResolvedValue({
        _id: new Types.ObjectId(projectId),
      });

      memberModel.findOne.mockResolvedValue({
        _id: new Types.ObjectId(assigneeId),
      });

      const result = await service.update(
        organizationId,
        ticketId,
        userId,
        {
          title: '  Updated ticket  ',
          description: '  Updated description  ',
          customerId,
          projectId,
          assigneeId,
          status: 'in_progress',
          priority: 'high',
        },
      );

      expect(result).toBe(ticket);

      expect(ticketModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: new Types.ObjectId(ticketId),
          organizationId: new Types.ObjectId(organizationId),
        },
        {
          $set: {
            title: 'Updated ticket',
            description: 'Updated description',
            customerId: new Types.ObjectId(customerId),
            projectId: new Types.ObjectId(projectId),
            assigneeId: new Types.ObjectId(assigneeId),
            status: 'in_progress',
            priority: 'high',
          },
        },
        {
          new: true,
          runValidators: true,
        },
      );

      expect(query.populate).toHaveBeenCalledTimes(3);

      expect(auditService.log).toHaveBeenCalledWith({
        organizationId,
        userId,
        action: 'UPDATE',
        entity: 'Ticket',
        entityId: ticket._id.toString(),
        metadata: {
          updatedFields: [
            'title',
            'description',
            'customerId',
            'projectId',
            'assigneeId',
            'status',
            'priority',
          ],
        },
      });
    });

    it('should update fields without relationship validation when relationships are omitted', async () => {
      const ticket = {
        _id: new Types.ObjectId(ticketId),
        title: 'Updated title',
      };

      setupUpdateQuery(ticket);

      await service.update(
        organizationId,
        ticketId,
        userId,
        {
          title: '  Updated title  ',
          status: 'resolved',
        },
      );

      expect(customerModel.findOne).not.toHaveBeenCalled();
      expect(projectModel.findOne).not.toHaveBeenCalled();
      expect(memberModel.findOne).not.toHaveBeenCalled();

      expect(ticketModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: new Types.ObjectId(ticketId),
          organizationId: new Types.ObjectId(organizationId),
        },
        {
          $set: {
            title: 'Updated title',
            status: 'resolved',
          },
        },
        {
          new: true,
          runValidators: true,
        },
      );
    });

    it('should throw when the updated customer does not exist', async () => {
      customerModel.findOne.mockResolvedValue(null);

      await expect(
        service.update(
          organizationId,
          ticketId,
          userId,
          {
            customerId,
          },
        ),
      ).rejects.toThrow('Customer not found');

      expect(ticketModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('should throw when the updated project does not exist', async () => {
      customerModel.findOne.mockResolvedValue({
        _id: new Types.ObjectId(customerId),
      });

      projectModel.findOne.mockResolvedValue(null);

      await expect(
        service.update(
          organizationId,
          ticketId,
          userId,
          {
            customerId,
            projectId,
          },
        ),
      ).rejects.toThrow('Project not found');

      expect(ticketModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('should throw when the updated assignee is not a member', async () => {
      customerModel.findOne.mockResolvedValue({
        _id: new Types.ObjectId(customerId),
      });

      memberModel.findOne.mockResolvedValue(null);

      await expect(
        service.update(
          organizationId,
          ticketId,
          userId,
          {
            customerId,
            assigneeId,
          },
        ),
      ).rejects.toThrow(
        'Assignee is not a member of this organization',
      );

      expect(ticketModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('should throw when the ticket does not exist', async () => {
      setupUpdateQuery(null);

      await expect(
        service.update(
          organizationId,
          ticketId,
          userId,
          {
            status: 'closed',
          },
        ),
      ).rejects.toThrow('Ticket not found');

      expect(auditService.log).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete the ticket and write an audit log', async () => {
      const ticket = {
        _id: new Types.ObjectId(ticketId),
        title: 'Ticket to delete',
      };

      setupDeleteQuery(ticket);

      const result = await service.remove(
        organizationId,
        ticketId,
        userId,
      );

      expect(result).toEqual({
        success: true,
        message: 'Ticket deleted successfully',
      });

      expect(ticketModel.findOneAndDelete).toHaveBeenCalledWith({
        _id: new Types.ObjectId(ticketId),
        organizationId: new Types.ObjectId(organizationId),
      });

      expect(auditService.log).toHaveBeenCalledWith({
        organizationId,
        userId,
        action: 'DELETE',
        entity: 'Ticket',
        entityId: ticket._id.toString(),
        metadata: {
          title: ticket.title,
        },
      });
    });

    it('should throw when the ticket does not exist', async () => {
      setupDeleteQuery(null);

      await expect(
        service.remove(
          organizationId,
          ticketId,
          userId,
        ),
      ).rejects.toThrow('Ticket not found');

      expect(auditService.log).not.toHaveBeenCalled();
    });
  });
});