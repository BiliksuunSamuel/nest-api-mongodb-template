import { Injectable, Logger } from '@nestjs/common';
import { ApiResponseDto } from 'src/dtos/common/api.response.dto';
import { UserRequest } from 'src/dtos/user/user.request.dto';
import { UserResponse } from 'src/dtos/user/user.response.dto';
import { CommonResponses } from 'src/helper/common.responses.helper';
import { UserRepository } from 'src/repositories/user.repository';
import { toUserResponse } from 'src/utils';
import { normalizePhoneNumber } from 'src/utils/phone';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(private readonly userRepository: UserRepository) {}

  async getById(id: string): Promise<ApiResponseDto<UserResponse>> {
    try {
      const user = await this.userRepository.getById(id);
      if (!user) {
        return CommonResponses.NotFoundResponse<UserResponse>();
      }
      return CommonResponses.OkResponse<UserResponse>(toUserResponse(user));
    } catch (error) {
      this.logger.error(
        'an error occurred while getting user by id',
        id,
        error,
      );
      return CommonResponses.InternalServerErrorResponse<UserResponse>();
    }
  }

  async getByPhoneNumber(
    phoneNumber: string,
  ): Promise<ApiResponseDto<UserResponse>> {
    try {
      const user = await this.userRepository.getByPhoneNumber(
        normalizePhoneNumber(phoneNumber),
      );
      if (!user) {
        return CommonResponses.NotFoundResponse<UserResponse>();
      }
      return CommonResponses.OkResponse<UserResponse>(toUserResponse(user));
    } catch (error) {
      this.logger.error(
        'an error occurred while getting user by phone number',
        phoneNumber,
        error,
      );
      return CommonResponses.InternalServerErrorResponse<UserResponse>();
    }
  }

  async update(
    id: string,
    request: UserRequest,
  ): Promise<ApiResponseDto<UserResponse>> {
    try {
      const user = await this.userRepository.update(id, request);
      if (!user) {
        return CommonResponses.NotFoundResponse<UserResponse>();
      }
      return CommonResponses.OkResponse<UserResponse>(toUserResponse(user));
    } catch (error) {
      this.logger.error(
        'an error occurred while updating user',
        { id, request },
        error,
      );
      return CommonResponses.InternalServerErrorResponse<UserResponse>();
    }
  }

  async delete(id: string): Promise<ApiResponseDto<UserResponse>> {
    try {
      const user = await this.userRepository.delete(id);
      if (!user) {
        return CommonResponses.NotFoundResponse<UserResponse>();
      }
      return CommonResponses.OkResponse<UserResponse>(toUserResponse(user));
    } catch (error) {
      this.logger.error('an error occurred while deleting user', id, error);
      return CommonResponses.InternalServerErrorResponse<UserResponse>();
    }
  }
}
