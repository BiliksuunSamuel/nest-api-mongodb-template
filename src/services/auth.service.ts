import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthResponse } from 'src/dtos/auth/auth.response.dto';
import { LoginRequest } from 'src/dtos/auth/login.request.dto';
import { UserJwtDetails } from 'src/dtos/auth/user.jwt.details';
import { ApiResponseDto } from 'src/dtos/common/api.response.dto';
import { UserResponse } from 'src/dtos/user/user.response.dto';
import { UserRepository } from 'src/repositories/user.repository';
import { comparePassword, generateId, toUserResponse } from 'src/utils';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  //get user by email
  async getUserByEmail(email: string): Promise<ApiResponseDto<UserResponse>> {
    try {
      const user = await this.userRepository.getByEmail(email);
      if (!user) {
        return {
          message: 'User not found',
          code: HttpStatus.NOT_FOUND,
        };
      }
      return {
        code: HttpStatus.OK,
        data: toUserResponse(user),
      };
    } catch (error) {
      this.logger.error(
        'an error occurred during get user by email',
        error,
        email,
      );
      return {
        message: 'sorry,something went wrong',
        code: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  async validateUser(username: string): Promise<any> {
    return await this.userRepository.getByEmail(username);
  }

  // revoke the token used for this request
  async logout(user: UserJwtDetails): Promise<ApiResponseDto<null>> {
    try {
      const current = await this.userRepository.getById(user.id);
      if (current) {
        await this.userRepository.updateAsync({ id: user.id }, {
          tokenIds: current.tokenIds.filter((t) => t !== user.tokenId),
        } as any);
      }
      return { code: HttpStatus.OK, message: 'Logged out' };
    } catch (error) {
      this.logger.error('an error occurred during logout', error, user.id);
      return {
        message: 'sorry,something went wrong',
        code: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  async login(request: LoginRequest): Promise<ApiResponseDto<AuthResponse>> {
    try {
      let user = await this.userRepository.getByEmail(request.email);
      if (!user) {
        return {
          message: 'Incorrect email address or password',
          code: HttpStatus.UNAUTHORIZED,
        };
      }

      const passwordMatch = await comparePassword(
        request.password,
        user.password,
      );
      if (!passwordMatch) {
        return {
          message: 'Incorrect email address or password',
          code: HttpStatus.UNAUTHORIZED,
        };
      }

      const authTokenId = generateId();
      user.updatedAt = new Date();
      // keep only the most recent sessions so the list cannot grow forever
      user.tokenIds = [...user.tokenIds, authTokenId].slice(-5);
      user.updatedBy = user.email;
      user.updatedAt = new Date();
      const { _id, ...others } = user as any;
      const res = await this.userRepository.updateAsync(
        { email: user.email },
        {
          ...others,
        },
      );

      if (!res) {
        return {
          message: 'Sorry,an error occured',
          code: HttpStatus.FAILED_DEPENDENCY,
        };
      }

      const payload: UserJwtDetails = {
        id: user.id,
        email: user.email,
        tokenId: authTokenId,
      };
      return {
        code: HttpStatus.OK,
        data: {
          user: toUserResponse({
            ...user,
          }),
          token: await this.jwtService.signAsync(payload),
        },
      };
    } catch (error) {
      this.logger.error('an error occurred during user login', error, request);
      return {
        message: 'sorry,something went wrong',
        code: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }
}
