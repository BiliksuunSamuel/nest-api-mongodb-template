import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
import { UserJwtDetails } from 'src/dtos/auth/user.jwt.details';
import { SessionStatus } from 'src/enums';
import { UserAuthSessionRepository } from 'src/repositories/user-auth-session.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { toPaginationInfo } from 'src/utils';
import { normalizePhoneNumber } from 'src/utils/phone';

// Endpoints the temporary (pre-OTP) token is allowed to call.
export const PENDING_TOKEN_PATHS = [
  '/api/authentication/verify-otp',
  '/api/authentication/resend-otp',
];

function isSessionExpired(expiresAt?: Date | null): boolean {
  return !!expiresAt && new Date(expiresAt).getTime() <= Date.now();
}

// Runs on every route except login:
// - normalises ?page & ?pageSize and body.phoneNumber
// - when a bearer token is sent, checks it against the user's session and
//   rejects it with a reason (SESSION_REPLACED / SESSION_ENDED /
//   SESSION_EXPIRED) the client can show. The user it belongs to is attached as
//   `req.authUser` for JwtStrategy.
// Routes still need JwtAuthGuard to *require* a token.
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthMiddleware.name);
  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: UserAuthSessionRepository,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (req.query) {
      const { page, pageSize } = toPaginationInfo(req.query);
      req.query['page'] = page as any;
      req.query['pageSize'] = pageSize as any;
    }
    if (typeof req.body?.phoneNumber === 'string') {
      req.body.phoneNumber = normalizePhoneNumber(req.body.phoneNumber);
    }

    const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) return next();

    const unauthorized = (reason?: string) =>
      res.status(401).send({
        code: 401,
        message: 'Unauthorized',
        ...(reason && { reason }),
      });

    try {
      const decoded = await this.jwtService.verifyAsync<UserJwtDetails>(token);
      const [user, session] = await Promise.all([
        this.userRepository.getById(decoded.id),
        this.sessionRepository.getByUserId(decoded.id),
      ]);
      if (!user || !session) return unauthorized();

      const path = req.originalUrl.split('?')[0].replace(/\/+$/, '');
      const isActive =
        session.status === SessionStatus.Active &&
        !!session.tokenId &&
        session.tokenId === decoded.tokenId;
      // The temporary token issued at login may only complete the OTP step.
      const isPendingOtp =
        !!session.pendingTokenId &&
        session.pendingTokenId === decoded.tokenId &&
        PENDING_TOKEN_PATHS.includes(path);

      if (isActive && isSessionExpired(session.sessionExpiresAt)) {
        await this.sessionRepository.end(user.id, SessionStatus.Expired);
        return unauthorized('SESSION_EXPIRED');
      }
      if (!isActive && !isPendingOtp) {
        // An Active session with a different token id means another device
        // signed in.
        return unauthorized(
          session.status === SessionStatus.Active
            ? 'SESSION_REPLACED'
            : 'SESSION_ENDED',
        );
      }
      (req as any).authUser = user;
    } catch (error) {
      this.logger.debug(`rejected token: ${error?.message}`);
      return unauthorized();
    }
    next();
  }
}
