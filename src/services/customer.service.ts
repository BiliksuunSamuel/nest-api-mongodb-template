import { Injectable, Logger } from '@nestjs/common';
import { ApiResponseDto } from 'src/dtos/common/api.response.dto';
import { CustomerRequest } from 'src/dtos/customer/customer.request.dto';
import { CommonResponses } from 'src/helper/common.responses.helper';
import { CustomerRepository } from 'src/repositories/customer.repository';
import { Customer } from 'src/schemas/customer.schema';

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);
  constructor(private readonly customerRepository: CustomerRepository) {}

  //get by id
  async getById(id: string): Promise<ApiResponseDto<Customer>> {
    try {
      const customer = await this.customerRepository.getById(id);
      if (!customer) {
        return CommonResponses.NotFoundResponse<Customer>('Customer not found');
      }
      return CommonResponses.OkResponse<Customer>(customer);
    } catch (error) {
      this.logger.error(
        'an error occurred while getting customer by id',
        id,
        error,
      );
      return CommonResponses.InternalServerErrorResponse<Customer>(
        'An error occurred while getting customer by id',
      );
    }
  }

  //get by email
  async getByEmail(email: string): Promise<ApiResponseDto<Customer>> {
    try {
      const customer = await this.customerRepository.getByEmail(email);
      if (!customer) {
        return CommonResponses.NotFoundResponse<Customer>('Customer not found');
      }
      return CommonResponses.OkResponse<Customer>(customer);
    } catch (error) {
      this.logger.error(
        'an error occurred while getting customer by email',
        email,
        error,
      );
      return CommonResponses.InternalServerErrorResponse<Customer>(
        'An error occurred while getting customer by email',
      );
    }
  }

  //create customer
  async create(request: CustomerRequest): Promise<ApiResponseDto<Customer>> {
    try {
      const customer = await this.customerRepository.create(request);
      return CommonResponses.CreatedResponse<Customer>(customer);
    } catch (error) {
      this.logger.error(
        'an error occurred while creating customer',
        request,
        error,
      );
      return CommonResponses.InternalServerErrorResponse<Customer>(
        'An error occurred while creating customer',
      );
    }
  }

  //update customer
  async update(
    id: string,
    request: CustomerRequest,
  ): Promise<ApiResponseDto<Customer>> {
    try {
      const customer = await this.customerRepository.update(id, request);
      if (!customer) {
        return CommonResponses.NotFoundResponse<Customer>('Customer not found');
      }
      return CommonResponses.OkResponse<Customer>(customer);
    } catch (error) {
      this.logger.error(
        'an error occurred while updating customer',
        { id, request },
        error,
      );
      return CommonResponses.InternalServerErrorResponse<Customer>(
        'An error occurred while updating customer',
      );
    }
  }

  //delete customer
  async delete(id: string): Promise<ApiResponseDto<Customer>> {
    try {
      const customer = await this.customerRepository.delete(id);
      if (!customer) {
        return CommonResponses.NotFoundResponse<Customer>('Customer not found');
      }
      return CommonResponses.OkResponse<Customer>(customer);
    } catch (error) {
      this.logger.error('an error occurred while deleting customer', id, error);
      return CommonResponses.InternalServerErrorResponse<Customer>(
        'An error occurred while deleting customer',
      );
    }
  }
}
