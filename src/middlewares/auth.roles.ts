import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from 'src/enums';
import { JwtAuthGuard } from 'src/providers/jwt-auth..guard';
import { RolesGuard } from 'src/providers/roles.guard';

// authenticates the caller (JwtAuthGuard) and then enforces the roles (RolesGuard)
export function AuthRoles(...roles: UserRole[]) {
  return applyDecorators(
    Roles(...roles),
    UseGuards(JwtAuthGuard, RolesGuard),
    ApiBearerAuth('Authorization'),
  );
}
