import { Logger } from '@nestjs/common';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from 'src/decorators/roles.decorator';
import { UserRole } from 'src/enums';
import { UserJwtDetails } from 'src/dtos/auth/user.jwt.details';

//create roles guard for checking user roles and permissions
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles) {
      return true; // If no roles are defined, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user: UserJwtDetails = request.user;

    this.logger.debug(`User roles: ${user?.role}, Required roles: ${roles}`);

    if (!user || !user.role) {
      return false; // If user is not authenticated or has no roles, deny access
    }
    // Check if the user's roles include any of the required roles
    return roles.includes(user.role as UserRole);
  }
}
