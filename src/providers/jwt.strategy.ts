import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import constants from 'src/constants';
import { UserJwtDetails } from 'src/dtos/auth/user.jwt.details';
import { User } from 'src/schemas/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: constants().secret,
      passReqToCallback: true,
    });
  }

  // Runs after the signature/expiry check. The session itself was checked by
  // AuthMiddleware, which attached the user; a request it didn't vouch for
  // (e.g. a route the middleware is excluded from) is refused. The user's
  // current role is used, so a role change applies without signing in again.
  async validate(
    req: Request,
    payload: UserJwtDetails,
  ): Promise<UserJwtDetails> {
    const user: User | undefined = (req as any).authUser;
    if (!user || user.id !== payload.id) {
      throw new UnauthorizedException();
    }
    return {
      id: user.id,
      name: user.name,
      tokenId: payload.tokenId,
      phoneNumber: user.phoneNumber,
      role: user.role,
    };
  }
}
