import { Prop, Schema } from '@nestjs/mongoose';
import { BaseSchema } from '.';
import { ApiProperty } from '@nestjs/swagger';
import { SessionStatus } from 'src/enums';

/**
 * The authentication state of a user, kept apart from the `User` profile.
 *
 * One document per user, holding the CURRENT session (a single active session
 * per account) and the pending OTP challenge. Rotating `tokenId` is what
 * invalidates every token issued earlier.
 *
 * `userId` is `User.id`.
 */
@Schema()
export class UserAuthSession extends BaseSchema {
  @ApiProperty()
  @Prop({ required: true })
  userId: string;

  // Id carried inside the JWT. A request is valid only if its token's id
  // matches this one; changing it signs out whichever device held the old one.
  @ApiProperty()
  @Prop({ default: null })
  tokenId: string;

  @ApiProperty({ enum: SessionStatus })
  @Prop({ type: String, enum: SessionStatus, default: SessionStatus.Pending })
  status: SessionStatus;

  // Id of the temporary token handed out at login, before the OTP is verified.
  // Kept apart from `tokenId` so requesting a code never signs out a session
  // that is already Active; it only becomes `tokenId` once the OTP is verified.
  @ApiProperty()
  @Prop({ default: null })
  pendingTokenId: string;

  // Pending OTP challenge. The code itself is never stored — only a keyed hash
  // (see utils/otp.ts) — and it is dropped once used, expired or guessed wrong
  // too many times.
  @ApiProperty()
  @Prop({ default: null })
  verificationCodeHash: string;

  @ApiProperty()
  @Prop({ default: null })
  verificationCodeExpiresAt: Date;

  // Wrong guesses against the current code.
  @ApiProperty()
  @Prop({ default: 0 })
  verificationAttempts: number;

  // Send limits: when the last code went out, and how many in the current
  // rolling window (see constants/otp.policy.ts).
  @ApiProperty()
  @Prop({ default: null })
  lastOtpSentAt: Date;

  @ApiProperty()
  @Prop({ default: null })
  otpWindowStartedAt: Date;

  @ApiProperty()
  @Prop({ default: 0 })
  otpSendsInWindow: number;

  // When the OTP was last verified successfully (start of the current session).
  @ApiProperty()
  @Prop({ default: null })
  authenticatedAt: Date;

  // When the current session stops being valid, regardless of `tokenId`. Null
  // means it doesn't expire on its own.
  @ApiProperty()
  @Prop({ default: null })
  sessionExpiresAt: Date;

  // Where the current session was started from — the client IP and User-Agent
  // of the request that verified the OTP. Informational only.
  @ApiProperty()
  @Prop({ default: null })
  ipAddress: string;

  @ApiProperty()
  @Prop({ default: null })
  agent: string;
}

export function configureSchema(schema: any) {
  // One session document per user; also the lookup used on every request.
  schema.index({ userId: 1 }, { unique: true });
  // Finding sessions to expire / audit by state.
  schema.index({ status: 1, sessionExpiresAt: 1 });
  return schema;
}
