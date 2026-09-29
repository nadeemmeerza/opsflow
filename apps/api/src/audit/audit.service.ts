import { Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  AuditLog,
  AuditLogDocument,
} from './schemas/audit-log.schema.js';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditModel:
      Model<AuditLogDocument>,
  ) {}

  async log(data: {
    organizationId: string;
    userId: string;

    action:
      | 'CREATE'
      | 'UPDATE'
      | 'DELETE'
      | 'LOGIN'
      | 'ADD_MEMBER'
      | 'REMOVE_MEMBER'
      | 'CHANGE_ROLE';

    entity: string;

    entityId?: string | null;

    metadata?: Record<string, unknown>;
  }) {
    return this.auditModel.create({
      organizationId:
        new Types.ObjectId(
          data.organizationId,
        ),

      userId:
        new Types.ObjectId(data.userId),

      action: data.action,

      entity: data.entity,

      entityId: data.entityId
        ? new Types.ObjectId(
            data.entityId,
          )
        : null,

      metadata:
        data.metadata ?? {},
    });
  }

  async findAll(
    organizationId: string,
  ) {
    return this.auditModel
      .find({
        organizationId:
          new Types.ObjectId(
            organizationId,
          ),
      })
      .populate(
        'userId',
        'name email',
      )
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  async findByEntity(
    organizationId: string,
    entity: string,
    entityId: string,
  ) {
    return this.auditModel
      .find({
        organizationId:
          new Types.ObjectId(
            organizationId,
          ),

        entity,

        entityId:
          new Types.ObjectId(entityId),
      })
      .populate(
        'userId',
        'name email',
      )
      .sort({
        createdAt: -1,
      })
      .exec();
  }
}
