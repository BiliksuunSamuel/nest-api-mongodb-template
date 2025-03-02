import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import constants from 'src/constants';
import { UserJwtDetails } from 'src/dtos/auth/user.jwt.details';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: constants().secret,
    });
  }

  async validate(payload: any): Promise<UserJwtDetails> {
    return {
      id: payload.id,
      email: payload?.email,
      tokenId: payload.tokenId,
    };
  }
}
