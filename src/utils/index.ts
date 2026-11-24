import { randomUUID } from 'crypto';
import { UserResponse } from 'src/dtos/user/user.response.dto';
import { User } from 'src/schemas/user.schema';

export function generateId() {
  return randomUUID().replace(/-/g, '');
}

export function toUserResponse(user: User, authenticated = true): UserResponse {
  return {
    id: user.id,
    name: user.name,
    phoneNumber: user.phoneNumber,
    role: user.role,
    authenticated,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    updatedBy: user.updatedBy,
    createdBy: user.createdBy,
  };
}

export function toPaginationInfo(object: any): {
  page: number;
  pageSize: number;
} {
  const page = object?.page;
  const pageSize = object?.pageSize;
  return {
    page: !isNaN(page) ? parseInt(page) : 1,
    pageSize: !isNaN(pageSize) ? parseInt(pageSize) : 10,
  };
}
