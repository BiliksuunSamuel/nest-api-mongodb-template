import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRequest } from 'src/dtos/user/user.request.dto';
import { User } from 'src/schemas/user.schema';
import { generateId } from 'src/utils';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User.name) private readonly userRepository: Model<User>,
  ) {}

  //get by id
  async getById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({ id }).lean();
  }

  //get by phone number (normalised, see utils/phone.ts)
  async getByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return await this.userRepository.findOne({ phoneNumber }).lean();
  }

  //the user with [phoneNumber], created on first sign-in. Atomic, so two
  //concurrent logins for a new number can't create two accounts.
  async findOrCreateByPhoneNumber(phoneNumber: string): Promise<User> {
    return await this.userRepository
      .findOneAndUpdate(
        { phoneNumber },
        {
          $setOnInsert: {
            id: generateId(),
            phoneNumber,
            createdAt: new Date(),
            createdBy: phoneNumber,
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .lean();
  }

  //update user
  async update(
    id: string,
    request: Partial<UserRequest>,
  ): Promise<User | null> {
    return await this.userRepository
      .findOneAndUpdate(
        { id },
        { $set: { ...request, updatedAt: new Date() } },
        { new: true },
      )
      .lean();
  }

  //delete user
  async delete(id: string): Promise<User | null> {
    return await this.userRepository.findOneAndDelete({ id }).lean();
  }
}
