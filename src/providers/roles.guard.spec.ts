import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'src/enums';
import { RolesGuard } from './roles.guard';

const ctx = (user: any) =>
  ({
    getHandler: () => null,
    getClass: () => null,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  it('allows when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(ctx(undefined))).toBe(true);
  });

  it('allows a matching role and denies others', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.Admin]);
    expect(guard.canActivate(ctx({ role: UserRole.Admin }))).toBe(true);
    expect(guard.canActivate(ctx({ role: UserRole.Client }))).toBe(false);
    expect(guard.canActivate(ctx(undefined))).toBe(false);
  });
});
