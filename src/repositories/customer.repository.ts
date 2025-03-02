import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomerRequest } from 'src/dtos/customer/customer.request.dto';
import { Customer } from 'src/schemas/customer.schema';
import { generateId } from 'src/utils';

@Injectable()
export class CustomerRepository {
  constructor(
    @InjectModel(Customer.name)
    private readonly customerRepository: Model<Customer>,
  ) {}

  //get by id
  async getById(id: string): Promise<Customer> {
    return await this.customerRepository.findOne({ id }).lean();
  }

  //get by email
  async getByEmail(email: string): Promise<Customer> {
    return await this.customerRepository.findOne({ email }).lean();
  }

  //create customer
  async create(request: CustomerRequest): Promise<Customer> {
    const res = await this.customerRepository.create({
      ...request,
      id: generateId(),
    });
    return await this.customerRepository.findById(res._id).lean();
  }

  //update customer
  async update(id: string, request: CustomerRequest): Promise<Customer> {
    const res = await this.customerRepository
      .findOneAndUpdate({ id }, { $set: request }, { new: true })
      .lean();
    return res;
  }

  //delete customer
  async delete(id: string): Promise<Customer> {
    return await this.customerRepository.findOneAndDelete({ id }).lean();
  }
}
