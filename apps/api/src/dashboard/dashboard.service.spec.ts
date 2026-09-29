import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';

import { DashboardService } from './dashboard.service.js';

import { Project } from '../projects/schemas/project.schema.js';
import { Task } from '../tasks/schemas/task.schema.js';
import { Customer } from '../customers/schemas/customer.schema.js';
import { Ticket } from '../tickets/schemas/ticket.schema.js';

describe('DashboardService', () => {
  let service: DashboardService;

  let projectModel: any;
  let taskModel: any;
  let customerModel: any;
  let ticketModel: any;

  const organizationId =
    new Types.ObjectId().toString();

  beforeEach(async () => {
    projectModel = {
      countDocuments: vi.fn(),
    };

    taskModel = {
      countDocuments: vi.fn(),
    };

    customerModel = {
      countDocuments: vi.fn(),
    };

    ticketModel = {
      countDocuments: vi.fn(),
    };

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          DashboardService,

          {
            provide: getModelToken(Project.name),
            useValue: projectModel,
          },

          {
            provide: getModelToken(Task.name),
            useValue: taskModel,
          },

          {
            provide: getModelToken(Customer.name),
            useValue: customerModel,
          },

          {
            provide: getModelToken(Ticket.name),
            useValue: ticketModel,
          },
        ],
      }).compile();

    service =
      module.get<DashboardService>(
        DashboardService,
      );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboard', () => {
    it('should return complete dashboard statistics', async () => {
      projectModel.countDocuments
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(7)  // active
        .mockResolvedValueOnce(3); // archived

      taskModel.countDocuments
        .mockResolvedValueOnce(20) // total
        .mockResolvedValueOnce(5)  // todo
        .mockResolvedValueOnce(6)  // in progress
        .mockResolvedValueOnce(4)  // review
        .mockResolvedValueOnce(5)  // done
        .mockResolvedValueOnce(2); // overdue

      customerModel.countDocuments
        .mockResolvedValueOnce(12) // total
        .mockResolvedValueOnce(9)  // active
        .mockResolvedValueOnce(3); // inactive

      ticketModel.countDocuments
        .mockResolvedValueOnce(15) // total
        .mockResolvedValueOnce(5)  // open
        .mockResolvedValueOnce(3)  // in progress
        .mockResolvedValueOnce(2)  // waiting
        .mockResolvedValueOnce(3)  // resolved
        .mockResolvedValueOnce(2); // closed

      const result =
        await service.getDashboard(
          organizationId,
        );

      expect(result).toEqual({
        projects: {
          total: 10,
          active: 7,
          archived: 3,
        },

        tasks: {
          total: 20,
          todo: 5,
          inProgress: 6,
          review: 4,
          done: 5,
        },

        customers: {
          total: 12,
          active: 9,
          inactive: 3,
        },

        tickets: {
          total: 15,
          open: 5,
          inProgress: 3,
          waiting: 2,
          resolved: 3,
          closed: 2,
        },

        overdueTasks: 2,
      });
    });

    it('should use the same organizationId for every query', async () => {
      projectModel.countDocuments
        .mockResolvedValue(0);

      taskModel.countDocuments
        .mockResolvedValue(0);

      customerModel.countDocuments
        .mockResolvedValue(0);

      ticketModel.countDocuments
        .mockResolvedValue(0);

      await service.getDashboard(
        organizationId,
      );

      const expectedOrganizationId =
        new Types.ObjectId(
          organizationId,
        );

      for (
        const call of projectModel.countDocuments.mock.calls
      ) {
        expect(call[0].organizationId)
          .toEqual(expectedOrganizationId);
      }

      for (
        const call of taskModel.countDocuments.mock.calls
      ) {
        expect(call[0].organizationId)
          .toEqual(expectedOrganizationId);
      }

      for (
        const call of customerModel.countDocuments.mock.calls
      ) {
        expect(call[0].organizationId)
          .toEqual(expectedOrganizationId);
      }

      for (
        const call of ticketModel.countDocuments.mock.calls
      ) {
        expect(call[0].organizationId)
          .toEqual(expectedOrganizationId);
      }
    });
  });

  describe('project statistics', () => {
    it('should count total, active, and archived projects', async () => {
      projectModel.countDocuments
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(7)
        .mockResolvedValueOnce(3);

      taskModel.countDocuments
        .mockResolvedValue(0);

      customerModel.countDocuments
        .mockResolvedValue(0);

      ticketModel.countDocuments
        .mockResolvedValue(0);

      await service.getDashboard(
        organizationId,
      );

      expect(
        projectModel.countDocuments,
      ).toHaveBeenCalledWith({
        organizationId:
          new Types.ObjectId(
            organizationId,
          ),
      });

      expect(
        projectModel.countDocuments,
      ).toHaveBeenCalledWith({
        organizationId:
          new Types.ObjectId(
            organizationId,
          ),
        status: 'active',
      });

      expect(
        projectModel.countDocuments,
      ).toHaveBeenCalledWith({
        organizationId:
          new Types.ObjectId(
            organizationId,
          ),
        status: 'archived',
      });
    });
  });

  describe('task statistics', () => {
    it('should count every supported task status', async () => {
      taskModel.countDocuments
        .mockResolvedValue(0);

      projectModel.countDocuments
        .mockResolvedValue(0);

      customerModel.countDocuments
        .mockResolvedValue(0);

      ticketModel.countDocuments
        .mockResolvedValue(0);

      await service.getDashboard(
        organizationId,
      );

      const expectedOrganizationId =
        new Types.ObjectId(
          organizationId,
        );

      expect(
        taskModel.countDocuments,
      ).toHaveBeenCalledWith({
        organizationId:
          expectedOrganizationId,
      });

      expect(
        taskModel.countDocuments,
      ).toHaveBeenCalledWith({
        organizationId:
          expectedOrganizationId,
        status: 'todo',
      });

      expect(
        taskModel.countDocuments,
      ).toHaveBeenCalledWith({
        organizationId:
          expectedOrganizationId,
        status: 'in_progress',
      });

      expect(
        taskModel.countDocuments,
      ).toHaveBeenCalledWith({
        organizationId:
          expectedOrganizationId,
        status: 'review',
      });

      expect(
        taskModel.countDocuments,
      ).toHaveBeenCalledWith({
        organizationId:
          expectedOrganizationId,
        status: 'done',
      });
    });
  });

  describe('customer statistics', () => {
    it('should count active and inactive customers', async () => {
      projectModel.countDocuments
        .mockResolvedValue(0);

      taskModel.countDocuments
        .mockResolvedValue(0);

      customerModel.countDocuments
        .mockResolvedValue(0);

      ticketModel.countDocuments
        .mockResolvedValue(0);

      await service.getDashboard(
        organizationId,
      );

      const expectedOrganizationId =
        new Types.ObjectId(
          organizationId,
        );

      expect(
        customerModel.countDocuments,
      ).toHaveBeenCalledWith({
        organizationId:
          expectedOrganizationId,
      });

      expect(
        customerModel.countDocuments,
      ).toHaveBeenCalledWith({
        organizationId:
          expectedOrganizationId,
        status: 'active',
      });

      expect(
        customerModel.countDocuments,
      ).toHaveBeenCalledWith({
        organizationId:
          expectedOrganizationId,
        status: 'inactive',
      });
    });
  });

  describe('ticket statistics', () => {
    it('should count every supported ticket status', async () => {
      projectModel.countDocuments
        .mockResolvedValue(0);

      taskModel.countDocuments
        .mockResolvedValue(0);

      customerModel.countDocuments
        .mockResolvedValue(0);

      ticketModel.countDocuments
        .mockResolvedValue(0);

      await service.getDashboard(
        organizationId,
      );

      const expectedOrganizationId =
        new Types.ObjectId(
          organizationId,
        );

      expect(
        ticketModel.countDocuments,
      ).toHaveBeenCalledWith({
        organizationId:
          expectedOrganizationId,
      });

      expect(
        ticketModel.countDocuments,
      ).toHaveBeenCalledWith({
        organizationId:
          expectedOrganizationId,
        status: 'open',
      });

      expect(
        ticketModel.countDocuments,
      ).toHaveBeenCalledWith({
        organizationId:
          expectedOrganizationId,
        status: 'in_progress',
      });

      expect(
        ticketModel.countDocuments,
      ).toHaveBeenCalledWith({
        organizationId:
          expectedOrganizationId,
        status: 'waiting',
      });

      expect(
        ticketModel.countDocuments,
      ).toHaveBeenCalledWith({
        organizationId:
          expectedOrganizationId,
        status: 'resolved',
      });

      expect(
        ticketModel.countDocuments,
      ).toHaveBeenCalledWith({
        organizationId:
          expectedOrganizationId,
        status: 'closed',
      });
    });
  });

  describe('overdue tasks', () => {
    it('should count only unfinished tasks with a past due date', async () => {
      projectModel.countDocuments
        .mockResolvedValue(0);

      taskModel.countDocuments
        .mockResolvedValue(0);

      customerModel.countDocuments
        .mockResolvedValue(0);

      ticketModel.countDocuments
        .mockResolvedValue(0);

      await service.getDashboard(
        organizationId,
      );

      const taskCalls =
        taskModel.countDocuments.mock.calls;

      const overdueCall =
        taskCalls.find(
          ([filter]: any[]) =>
            filter.dueDate &&
            filter.status?.$ne === 'done',
        );

      expect(overdueCall).toBeDefined();

      const filter =
        overdueCall[0];

      expect(filter.organizationId)
        .toEqual(
          new Types.ObjectId(
            organizationId,
          ),
        );

      expect(filter.dueDate.$ne)
        .toBeNull();

      expect(filter.dueDate.$lt)
        .toBeInstanceOf(Date);

      expect(filter.status)
        .toEqual({
          $ne: 'done',
        });
    });
  });

  it('should handle zero statistics correctly', async () => {
    projectModel.countDocuments
      .mockResolvedValue(0);

    taskModel.countDocuments
      .mockResolvedValue(0);

    customerModel.countDocuments
      .mockResolvedValue(0);

    ticketModel.countDocuments
      .mockResolvedValue(0);

    const result =
      await service.getDashboard(
        organizationId,
      );

    expect(result).toEqual({
      projects: {
        total: 0,
        active: 0,
        archived: 0,
      },

      tasks: {
        total: 0,
        todo: 0,
        inProgress: 0,
        review: 0,
        done: 0,
      },

      customers: {
        total: 0,
        active: 0,
        inactive: 0,
      },

      tickets: {
        total: 0,
        open: 0,
        inProgress: 0,
        waiting: 0,
        resolved: 0,
        closed: 0,
      },

      overdueTasks: 0,
    });
  });
});