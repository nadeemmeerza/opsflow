import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CustomerDocument = HydratedDocument<Customer>;

@Schema({
  timestamps: true,
})
export class Customer {
  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 150,
  })
  name: string;

  @Prop({
    trim: true,
    lowercase: true,
    index: true,
  })
  email: string;

  @Prop({
    trim: true,
    maxlength: 30,
  })
  phone: string;

  @Prop({
    trim: true,
    maxlength: 150,
  })
  company: string;

  @Prop({
    trim: true,
    maxlength: 1000,
    default: '',
  })
  notes: string;

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
  })
  createdBy: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['active', 'inactive'],
    default: 'active',
  })
  status: 'active' | 'inactive';

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const CustomerSchema =
  SchemaFactory.createForClass(Customer);

CustomerSchema.index({
  organizationId: 1,
  email: 1,
});

CustomerSchema.index({
  organizationId: 1,
  status: 1,
  createdAt: -1,
});

CustomerSchema.index({
  organizationId: 1,
  createdAt: -1,
});