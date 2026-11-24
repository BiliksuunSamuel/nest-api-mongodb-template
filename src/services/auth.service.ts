import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import configuration from 'src/configuration';
import { OtpPolicy } from 'src/constants/otp.policy';
import { AuthResponse } from 'src/dtos/auth/auth.response.dto';
import { LoginRequest } from 'src/dtos/auth/login.request.dto';
import { OtpVerificationRequestDto } from 'src/dtos/auth/otp-verification-request.dto';
import { UserJwtDetails } from 'src/dtos/auth/user.jwt.details';
import { ApiResponseDto } from 'src/dtos/common/api.response.dto';
import { UserRequest } from 'src/dtos/user/user.request.dto';
import { UserResponse } from 'src/dtos/user/user.response.dto';
import { SessionStatus } from 'src/enums';
import { CommonResponses } from 'src/helper/common.responses.helper';
import { UserAuthSessionRepository } from 'src/repositories/user-auth-session.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { User } from 'src/schemas/user.schema';
import { generateId, toUserResponse } from 'src/utils';
import { generateOtp, hashOtp, otpMatches } from 'src/utils/otp';
import { normalizePhoneNumber } from 'src/utils/phone';
import { reviewOtpFor } from 'src/utils/review-account';
import { SmsService } from './sms.service';

type OtpPatch = {
  verificationCodeHash: string;
  verificationCodeExpiresAt: Date;
  verificationAttempts: number;
  lastOtpSentAt: Date;
  otpWindowStartedAt: Date;
  otpSendsInWindow: number;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: UserAuthSessionRepository,
    private readonly jwtService: JwtService,
    private readonly smsService: SmsService,
  ) {}

  //get the signed-in user's profile
  async getProfile(userId: string): Promise<ApiResponseDto<UserResponse>> {
    try {
      const user = await this.userRepository.getById(userId);
      if (!user) {
        return CommonResponses.NotFoundResponse<UserResponse>('User not found');
      }
      return CommonResponses.OkResponse(toUserResponse(user));
    } catch (error) {
      this.logger.error('an error occurred during get profile', error, userId);
      return CommonResponses.InternalServerErrorResponse<UserResponse>();
    }
  }

  async validateUser(phoneNumber: string): Promise<User | null> {
    return await this.userRepository.getByPhoneNumber(
      normalizePhoneNumber(phoneNumber),
    );
  }

  private tooManyRequests<T>(message: string): ApiResponseDto<T> {
    return { code: HttpStatus.TOO_MANY_REQUESTS, message };
  }

  private sign(user: User, tokenId: string): Promise<string> {
    const payload: UserJwtDetails = {
      id: user.id,
      name: user.name,
      tokenId,
      phoneNumber: user.phoneNumber,
      role: user.role,
    };
    return this.jwtService.signAsync(payload);
  }

  private sendCode(user: User, code: string) {
    const message = `Your ${configuration().appName} verification code is ${code}. It expires in ${Math.round(OtpPolicy.ttlMs / 60000)} minutes.`;
    // not awaited: a slow SMS provider must not hold up the response
    this.smsService
      .send(user.phoneNumber, message)
      .catch((e) => this.logger.error('failed to send verification code', e));
  }

  /// Decides whether a new sign-in code may go out for this account and, if so,
  /// prepares it: a fresh code (returned in plain text ONLY to be texted, never
  /// stored) plus the session fields to save (its hash, expiry, reset attempt
  /// counter and the send-limit bookkeeping). Limits: one code per cooldown, and
  /// a few per rolling window — each SMS costs money and can be abused.
  private planOtp(
    session: {
      lastOtpSentAt?: Date | null;
      otpWindowStartedAt?: Date | null;
      otpSendsInWindow?: number;
    } | null,
    // Fixed code for a review account (see reviewOtpFor). Such accounts get no
    // SMS, and no send limits so a reviewer is never locked out.
    reviewCode: string | null = null,
  ): { error: ApiResponseDto<any> } | { code: string; patch: OtpPatch } {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + OtpPolicy.ttlMs);
    if (reviewCode) {
      return {
        code: reviewCode,
        patch: {
          verificationCodeHash: hashOtp(reviewCode),
          verificationCodeExpiresAt: expiresAt,
          verificationAttempts: 0,
          lastOtpSentAt: now,
          otpWindowStartedAt: now,
          otpSendsInWindow: 0,
        },
      };
    }
    const last = session?.lastOtpSentAt
      ? new Date(session.lastOtpSentAt).getTime()
      : 0;
    const sinceLast = now.getTime() - last;
    if (last && sinceLast < OtpPolicy.resendCooldownMs) {
      const wait = Math.ceil((OtpPolicy.resendCooldownMs - sinceLast) / 1000);
      return {
        error: this.tooManyRequests(
          `Please wait ${wait}s before requesting another code`,
        ),
      };
    }

    let windowStart = session?.otpWindowStartedAt
      ? new Date(session.otpWindowStartedAt)
      : null;
    let sends = session?.otpSendsInWindow ?? 0;
    if (
      !windowStart ||
      now.getTime() - windowStart.getTime() > OtpPolicy.windowMs
    ) {
      windowStart = now;
      sends = 0;
    }
    if (sends >= OtpPolicy.maxSendsPerWindow) {
      return {
        error: this.tooManyRequests(
          'Too many codes requested. Please try again later',
        ),
      };
    }

    const code = generateOtp();
    return {
      code,
      patch: {
        verificationCodeHash: hashOtp(code),
        verificationCodeExpiresAt: expiresAt,
        verificationAttempts: 0,
        lastOtpSentAt: now,
        otpWindowStartedAt: windowStart,
        otpSendsInWindow: sends + 1,
      },
    };
  }

  //step 1: send a code to the phone number and hand back a temporary token.
  //The account is created on first sign-in.
  async login(request: LoginRequest): Promise<ApiResponseDto<AuthResponse>> {
    try {
      const phoneNumber = normalizePhoneNumber(request.phoneNumber);
      const user =
        await this.userRepository.findOrCreateByPhoneNumber(phoneNumber);

      // Start an OTP challenge with a temporary (pending) token. A session that
      // is already Active is left untouched: asking for a code must not sign
      // out the device that is currently logged in — that only happens once the
      // code is verified.
      const existing = await this.sessionRepository.getByUserId(user.id);
      const reviewCode = reviewOtpFor(
        user.phoneNumber,
        configuration().reviewAccounts,
      );
      const plan = this.planOtp(existing, reviewCode);
      if ('error' in plan) return plan.error;

      const pendingTokenId = generateId();
      await this.sessionRepository.upsert(user.id, {
        pendingTokenId,
        ...plan.patch,
        updatedBy: user.phoneNumber,
      });

      if (!reviewCode) this.sendCode(user, plan.code);
      return CommonResponses.OkResponse<AuthResponse>(
        {
          token: await this.sign(user, pendingTokenId),
          phoneNumber: user.phoneNumber,
          verificationCodeExpiresAt: plan.patch.verificationCodeExpiresAt,
          user: null,
        },
        'Verification code sent, please check your phone.',
      );
    } catch (error) {
      this.logger.error('an error occurred during user login', error);
      return CommonResponses.InternalServerErrorResponse<AuthResponse>();
    }
  }

  //send a new code for the pending sign-in
  async handleResendVerificationCode(
    userId: string,
  ): Promise<ApiResponseDto<AuthResponse>> {
    try {
      const user = await this.userRepository.getById(userId);
      const session = await this.sessionRepository.getByUserId(userId);
      if (!user || !session || !session.pendingTokenId) {
        return CommonResponses.NotFoundResponse<AuthResponse>(
          'No sign-in in progress',
        );
      }
      const reviewCode = reviewOtpFor(
        user.phoneNumber,
        configuration().reviewAccounts,
      );
      const plan = this.planOtp(session, reviewCode);
      if ('error' in plan) return plan.error;

      // The temporary token is kept as is, so a client that doesn't swap in
      // the returned token can still verify.
      await this.sessionRepository.update(user.id, {
        ...plan.patch,
        updatedBy: user.phoneNumber,
      });

      if (!reviewCode) this.sendCode(user, plan.code);
      return CommonResponses.OkResponse<AuthResponse>(
        {
          token: await this.sign(user, session.pendingTokenId),
          phoneNumber: user.phoneNumber,
          verificationCodeExpiresAt: plan.patch.verificationCodeExpiresAt,
          user: null,
        },
        'Verification code resent, please check your phone.',
      );
    } catch (error) {
      this.logger.error(
        'an error occurred during resend verification code',
        error,
        userId,
      );
      return CommonResponses.InternalServerErrorResponse<AuthResponse>();
    }
  }

  //step 2: check the code; on success this becomes the account's one active
  //session and the session token is returned
  async handleVerifyOtp(
    userId: string,
    request: OtpVerificationRequestDto,
    meta: { ipAddress?: string; agent?: string } = {},
  ): Promise<ApiResponseDto<AuthResponse>> {
    try {
      const user = await this.userRepository.getById(userId);
      const session = await this.sessionRepository.getByUserId(userId);
      if (!user || !session) {
        return CommonResponses.NotFoundResponse<AuthResponse>(
          'Account not found',
        );
      }
      // The code must exist and still be valid.
      const expiresAt = session.verificationCodeExpiresAt
        ? new Date(session.verificationCodeExpiresAt).getTime()
        : 0;
      if (!session.verificationCodeHash || expiresAt <= Date.now()) {
        return CommonResponses.UnauthorizedResponse<AuthResponse>(
          'This verification code has expired, please request a new one',
        );
      }
      // Too many wrong guesses already: the code is dead.
      if ((session.verificationAttempts ?? 0) >= OtpPolicy.maxAttempts) {
        return this.tooManyRequests(
          'Too many incorrect attempts, please request a new code',
        );
      }
      if (!otpMatches(request.verificationCode, session.verificationCodeHash)) {
        const attempts =
          await this.sessionRepository.incrementVerificationAttempts(user.id);
        if (attempts >= OtpPolicy.maxAttempts) {
          await this.sessionRepository.update(user.id, {
            verificationCodeHash: null,
            verificationCodeExpiresAt: null,
          });
          return this.tooManyRequests(
            'Too many incorrect attempts, please request a new code',
          );
        }
        const left = OtpPolicy.maxAttempts - attempts;
        return CommonResponses.UnauthorizedResponse<AuthResponse>(
          `Incorrect verification code, ${left} ${left === 1 ? 'attempt' : 'attempts'} left`,
        );
      }

      // The code is right: this becomes the account's one active session. The
      // previous token id is replaced, so whichever device held it is signed
      // out on its next request.
      const now = new Date();
      const tokenId = generateId();
      const lifetimeDays = configuration().sessionLifetimeDays;
      await this.sessionRepository.update(user.id, {
        tokenId,
        pendingTokenId: null,
        status: SessionStatus.Active,
        verificationCodeHash: null,
        verificationCodeExpiresAt: null,
        verificationAttempts: 0,
        authenticatedAt: now,
        sessionExpiresAt: lifetimeDays
          ? new Date(now.getTime() + lifetimeDays * 24 * 60 * 60 * 1000)
          : null,
        ipAddress: meta.ipAddress ?? null,
        agent: meta.agent ?? null,
        updatedBy: user.phoneNumber,
      });

      return CommonResponses.OkResponse<AuthResponse>(
        {
          token: await this.sign(user, tokenId),
          user: toUserResponse(user),
          phoneNumber: user.phoneNumber,
          verificationCodeExpiresAt: null,
        },
        'User authenticated successfully',
      );
    } catch (error) {
      this.logger.error('an error occurred during verify otp', error, userId);
      return CommonResponses.InternalServerErrorResponse<AuthResponse>();
    }
  }

  //end the current session
  async handleSignOut(userId: string): Promise<ApiResponseDto<boolean>> {
    try {
      const session = await this.sessionRepository.end(
        userId,
        SessionStatus.SignedOut,
      );
      if (!session) {
        return CommonResponses.NotFoundResponse<boolean>('Account not found');
      }
      return CommonResponses.OkResponse(true, 'User signed out successfully');
    } catch (error) {
      this.logger.error('an error occurred during signout', error, userId);
      return CommonResponses.InternalServerErrorResponse<boolean>();
    }
  }

  //set the profile details collected after the first sign-in
  async handleProfileSetup(
    userId: string,
    request: UserRequest,
  ): Promise<ApiResponseDto<UserResponse>> {
    try {
      const user = await this.userRepository.update(userId, {
        name: request.name,
      });
      if (!user) {
        return CommonResponses.NotFoundResponse<UserResponse>(
          'Account not found',
        );
      }
      return CommonResponses.OkResponse(
        toUserResponse(user),
        'Profile setup completed successfully',
      );
    } catch (error) {
      this.logger.error(
        'an error occurred during profile setup',
        error,
        userId,
      );
      return CommonResponses.InternalServerErrorResponse<UserResponse>();
    }
  }
}
