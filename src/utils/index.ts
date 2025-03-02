import { randomUUID } from 'crypto';
import { UserResponse } from 'src/dtos/user/user.response.dto';
import * as bcrypt from 'bcrypt';
export function generateId() {
  return randomUUID().replace(/-/g, '');
}

export function toUserResponse(user): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    updatedBy: user.updatedBy,
    createdBy: user.createdBy,
  };
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
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
