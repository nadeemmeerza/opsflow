import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AuditLogDocument =
  HydratedDocument<AuditLog>;

@Schema({
  timestamps: true,
})
export class AuditLog {
  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Organization',
    index: true,
  })
  organizationId: Types.ObjectId;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'User',
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    enum: [
      'CREATE',
      'UPDATE',
      'DELETE',
      'LOGIN',
      'ADD_MEMBER',
      'REMOVE_MEMBER',
      'CHANGE_ROLE',
    ],
    index: true,
  })
  action:
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'LOGIN'
    | 'ADD_MEMBER'
    | 'REMOVE_MEMBER'
    | 'CHANGE_ROLE';

  @Prop({
    required: true,
    trim: true,
    maxlength: 100,
  })
  entity: string;

  @Prop({
    type: Types.ObjectId,
    default: null,
  })
  entityId: Types.ObjectId | null;

  @Prop({
    type: Object,
    default: {},
  })
  metadata: Record<string, unknown>;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const AuditLogSchema =
  SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({
  organizationId: 1,
  createdAt: -1,
});

AuditLogSchema.index({
  organizationId: 1,
  entity: 1,
  entityId: 1,
});

AuditLogSchema.index({
  organizationId: 1,
  userId: 1,
  createdAt: -1,
});