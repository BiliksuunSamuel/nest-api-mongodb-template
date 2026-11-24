import { ApiProperty } from '@nestjs/swagger';
import { UserResponse } from '../user/user.response.dto';

export class AuthResponse {
  // null until the OTP is verified
  @ApiProperty({ nullable: true })
  user: UserResponse | null;
  // after login/resend: a temporary token that may only call verify-otp and
  // resend-otp. After verify-otp: the session token.
  @ApiProperty()
  token: string;
  @ApiProperty()
  verificationCodeExpiresAt: Date | null;
  @ApiProperty()
  phoneNumber: string;
}
