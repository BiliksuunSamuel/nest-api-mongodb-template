import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import constants from 'src/constants';
import { UserJwtDetails } from 'src/dtos/auth/user.jwt.details';
import { UserRepository } from 'src/repositories/user.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userRepository: UserRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: constants().secret,
    });
  }

  // runs after the signature/expiry check; rejects revoked tokens and
  // attaches the user's current role so RolesGuard can enforce RBAC
  async validate(payload: UserJwtDetails): Promise<UserJwtDetails> {
    const user = await this.userRepository.getById(payload.id);
    if (!user || !user.tokenIds?.includes(payload.tokenId)) {
      throw new UnauthorizedException();
    }
    return {
      id: user.id,
      email: user.email,
      tokenId: payload.tokenId,
      role: user.role,
    };
  }
}
