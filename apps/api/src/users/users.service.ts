import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  User,
  UserDocument,
} from './schemas/user.schema.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(data: {
    name: string;
    email: string;
    passwordHash: string;
  }) {
    const user = new this.userModel(data);

    return user.save();
  }

  async findByEmail(email: string) {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+passwordHash')
      .exec();
  }

  async findByEmailWithoutPassword(email: string) {
  return this.userModel
    .findOne({ email: email.toLowerCase() })
    .exec();
}


  async findById(id: string) {
    return this.userModel.findById(id).exec();
  }
}
