import { applyDecorators, UseGuards } from '@nestjs/common';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from 'src/enums';
import { RolesGuard } from 'src/providers/roles.guard';

export function AuthRoles(...roles: UserRole[]) {
  return applyDecorators(Roles(...roles), UseGuards(RolesGuard));
}
