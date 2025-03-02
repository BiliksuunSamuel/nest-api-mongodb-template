import { HttpStatus } from '@nestjs/common';
import { ApiResponseDto } from 'src/dtos/common/api.response.dto';
export class CommonResponses {
  static OkResponse<T>(data: T, message?: string): ApiResponseDto<T> {
    return {
      code: HttpStatus.OK,
      data,
      message: message || 'Success',
    };
  }

  static CreatedResponse<T>(data: T, message?: string): ApiResponseDto<T> {
    return {
      code: HttpStatus.CREATED,
      data,
      message: message || 'Created successfully',
    };
  }

  static BadRequestResponse<T>(data?: T, message?: string): ApiResponseDto<T> {
    return {
      code: HttpStatus.BAD_REQUEST,
      data,
      message: message || 'Bad request',
    };
  }

  static UnauthorizedResponse<T>(message?: string): ApiResponseDto<T> {
    return {
      code: HttpStatus.UNAUTHORIZED,
      message: message || 'Unauthorized',
    };
  }

  static ForbiddenResponse<T>(message?: string): ApiResponseDto<T> {
    return {
      code: HttpStatus.FORBIDDEN,
      message: message || 'Forbidden',
    };
  }

  static NotFoundResponse<T>(message?: string): ApiResponseDto<T> {
    return {
      code: HttpStatus.NOT_FOUND,
      message: message || 'Resource Not found',
    };
  }

  static ConflictResponse<T>(message?: string): ApiResponseDto<T> {
    return {
      code: HttpStatus.CONFLICT,
      message: message || 'Conflict',
    };
  }

  static InternalServerErrorResponse<T>(message?: string): ApiResponseDto<T> {
    return {
      code: HttpStatus.INTERNAL_SERVER_ERROR,
      message: message || 'Internal server error',
    };
  }

  static NotImplementedResponse<T>(message?: string): ApiResponseDto<T> {
    return {
      code: HttpStatus.NOT_IMPLEMENTED,
      message: message || 'Not implemented',
    };
  }

  static BadGatewayResponse<T>(message?: string): ApiResponseDto<T> {
    return {
      code: HttpStatus.BAD_GATEWAY,
      message: message || 'Bad gateway',
    };
  }

  static ServiceUnavailableResponse<T>(message?: string): ApiResponseDto<T> {
    return {
      code: HttpStatus.SERVICE_UNAVAILABLE,
      message: message || 'Service unavailable',
    };
  }

  static FaildedDependencyResponse<T>(message?: string): ApiResponseDto<T> {
    return {
      code: HttpStatus.FAILED_DEPENDENCY,
      message: message || 'Failed dependency',
    };
  }
}
