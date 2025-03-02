import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserRequest } from 'src/dtos/user/create.user.request.dto';
import { UserRequest } from 'src/dtos/user/user.request.dto';
import { User } from 'src/schemas/user.schema';
import { generateId } from 'src/utils';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User.name) private readonly userRepository: Model<User>,
  ) {}

  //update user by query
  async updateAsync(query: any, request: User): Promise<User> {
    return await this.userRepository
      .findOneAndUpdate(query, { $set: request }, { new: true })
      .lean();
  }

  //get by id
  async getById(id: string): Promise<User> {
    return await this.userRepository.findOne({ id }).lean();
  }

  //get by email
  async getByEmail(email: string): Promise<User> {
    return await this.userRepository.findOne({ email }).lean();
  }

  //create user
  async create(request: CreateUserRequest): Promise<User> {
    const res = await this.userRepository.create({
      ...request,
      id: generateId(),
    });
    return await this.userRepository.findById(res._id).lean();
  }

  //update user
  async update(id: string, request: UserRequest): Promise<User> {
    const res = await this.userRepository
      .findOneAndUpdate({ id }, { $set: request }, { new: true })
      .lean();
    return res;
  }

  //delete user
  async delete(id: string): Promise<User> {
    return await this.userRepository.findOneAndDelete({ id }).lean();
  }
}
