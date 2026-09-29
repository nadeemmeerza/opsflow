import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TicketDocument = HydratedDocument<Ticket>;

@Schema({
  timestamps: true,
})
export class Ticket {
  @Prop({
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 200,
  })
  title: string;

  @Prop({
    trim: true,
    maxlength: 5000,
    default: '',
  })
  description: string;

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
    ref: 'Customer',
    index: true,
  })
  customerId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Project',
    default: null,
  })
  projectId: Types.ObjectId | null;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    default: null,
  })
  assigneeId: Types.ObjectId | null;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'User',
  })
  createdBy: Types.ObjectId;

  @Prop({
    required: true,
    enum: [
      'open',
      'in_progress',
      'waiting',
      'resolved',
      'closed',
    ],
    default: 'open',
  })
  status:
    | 'open'
    | 'in_progress'
    | 'waiting'
    | 'resolved'
    | 'closed';

  @Prop({
    required: true,
    enum: [
      'low',
      'medium',
      'high',
      'urgent',
    ],
    default: 'medium',
  })
  priority:
    | 'low'
    | 'medium'
    | 'high'
    | 'urgent';

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const TicketSchema =
  SchemaFactory.createForClass(Ticket);

TicketSchema.index({
  organizationId: 1,
  status: 1,
});

TicketSchema.index({
  organizationId: 1,
  customerId: 1,
});

TicketSchema.index({
  organizationId: 1,
  assigneeId: 1,
});

TicketSchema.index({
  organizationId: 1,
  projectId: 1,
});

TicketSchema.index({
  organizationId: 1,
  createdAt: -1,
});

