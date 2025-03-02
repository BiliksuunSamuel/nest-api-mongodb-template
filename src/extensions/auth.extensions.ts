import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { UserJwtDetails } from 'src/dtos/auth/user.jwt.details';

export const AuthUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserJwtDetails => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
