import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
})
export class User {
  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  })
  name: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email: string;

  @Prop({
    required: true,
    select: false, //important not returned password field through user find() queries
  })
  passwordHash: string;

  @Prop({
    required: true,
    enum: ['active', 'suspended'],
    default: 'active',
  })
  status: 'active' | 'suspended';

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  
}

export const UserSchema = SchemaFactory.createForClass(User);
