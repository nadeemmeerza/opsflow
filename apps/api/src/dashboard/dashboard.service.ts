import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Project,
  ProjectDocument,
} from '../projects/schemas/project.schema.js';

import {
  Task,
  TaskDocument,
} from '../tasks/schemas/task.schema.js';

import {
  Customer,
  CustomerDocument,
} from '../customers/schemas/customer.schema.js';

import {
  Ticket,
  TicketDocument,
} from '../tickets/schemas/ticket.schema.js';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,

    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,

    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,

    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<TicketDocument>,
  ) {}

  /**
   * Builds the complete organization dashboard.
   *
   * Each statistic is independent, so the database operations
   * are executed concurrently with Promise.all rather than
   * waiting for one group of queries to finish before starting
   * the next group.
   */
  async getDashboard(organizationId: string) {
    const organizationObjectId =
      new Types.ObjectId(organizationId);

    const [
      projects,
      tasks,
      customers,
      tickets,
      overdueTasks,
    ] = await Promise.all([
      this.getProjectStats(
        organizationObjectId,
      ),

      this.getTaskStats(
        organizationObjectId,
      ),

      this.getCustomerStats(
        organizationObjectId,
      ),

      this.getTicketStats(
        organizationObjectId,
      ),

      this.getOverdueTaskCount(
        organizationObjectId,
      ),
    ]);

    /**
     * Keep the response grouped by business domain.
     * This directly matches the DashboardStats interface
     * used by the Next.js dashboard.
     */
    return {
      projects,
      tasks,
      customers,
      tickets,
      overdueTasks,
    };
  }

  /**
   * Counts tasks whose due date has passed and which
   * have not yet reached the "done" status.
   */
  private async getOverdueTaskCount(
    organizationId: Types.ObjectId,
  ) {
    return this.taskModel.countDocuments({
      organizationId,

      dueDate: {
        $lt: new Date(),
        $ne: null,
      },

      status: {
        $ne: 'done',
      },
    });
  }

  /**
   * Returns project totals grouped by project status.
   */
  private async getProjectStats(
    organizationId: Types.ObjectId,
  ) {
    const [
      total,
      active,
      archived,
    ] = await Promise.all([
      this.projectModel.countDocuments({
        organizationId,
      }),

      this.projectModel.countDocuments({
        organizationId,
        status: 'active',
      }),

      this.projectModel.countDocuments({
        organizationId,
        status: 'archived',
      }),
    ]);

    return {
      total,
      active,
      archived,
    };
  }

  /**
   * Returns task totals grouped by the supported
   * task workflow states.
   */
  private async getTaskStats(
    organizationId: Types.ObjectId,
  ) {
    const [
      total,
      todo,
      inProgress,
      review,
      done,
    ] = await Promise.all([
      this.taskModel.countDocuments({
        organizationId,
      }),

      this.taskModel.countDocuments({
        organizationId,
        status: 'todo',
      }),

      this.taskModel.countDocuments({
        organizationId,
        status: 'in_progress',
      }),

      this.taskModel.countDocuments({
        organizationId,
        status: 'review',
      }),

      this.taskModel.countDocuments({
        organizationId,
        status: 'done',
      }),
    ]);

    return {
      total,
      todo,
      inProgress,
      review,
      done,
    };
  }

  /**
   * Returns customer totals grouped by active/inactive status.
   */
  private async getCustomerStats(
    organizationId: Types.ObjectId,
  ) {
    const [
      total,
      active,
      inactive,
    ] = await Promise.all([
      this.customerModel.countDocuments({
        organizationId,
      }),

      this.customerModel.countDocuments({
        organizationId,
        status: 'active',
      }),

      this.customerModel.countDocuments({
        organizationId,
        status: 'inactive',
      }),
    ]);

    return {
      total,
      active,
      inactive,
    };
  }

  /**
   * Returns ticket totals grouped by the complete
   * ticket lifecycle represented by the application.
   */
  private async getTicketStats(
    organizationId: Types.ObjectId,
  ) {
    const [
      total,
      open,
      inProgress,
      waiting,
      resolved,
      closed,
    ] = await Promise.all([
      this.ticketModel.countDocuments({
        organizationId,
      }),

      this.ticketModel.countDocuments({
        organizationId,
        status: 'open',
      }),

      this.ticketModel.countDocuments({
        organizationId,
        status: 'in_progress',
      }),

      this.ticketModel.countDocuments({
        organizationId,
        status: 'waiting',
      }),

      this.ticketModel.countDocuments({
        organizationId,
        status: 'resolved',
      }),

      this.ticketModel.countDocuments({
        organizationId,
        status: 'closed',
      }),
    ]);

    return {
      total,
      open,
      inProgress,
      waiting,
      resolved,
      closed,
    };
  }
}