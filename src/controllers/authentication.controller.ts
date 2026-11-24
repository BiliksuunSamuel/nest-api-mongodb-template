import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';
import { LoginRequest } from 'src/dtos/auth/login.request.dto';
import { OtpVerificationRequestDto } from 'src/dtos/auth/otp-verification-request.dto';
import { UserJwtDetails } from 'src/dtos/auth/user.jwt.details';
import { UserRequest } from 'src/dtos/user/user.request.dto';
import { AuthUser } from 'src/extensions/auth.extensions';
import { JwtAuthGuard } from 'src/providers/jwt-auth..guard';
import { AuthService } from 'src/services/auth.service';

@Controller('api/authentication')
@ApiTags('Authentication')
@ApiBearerAuth('Authorization')
export class AuthenticationController {
  constructor(private readonly authService: AuthService) {}

  // Step 1. Each code is an SMS that costs money: cap requests per client IP,
  // on top of the per-account limits in AuthService.
  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() req: LoginRequest) {
    return await this.authService.login(req);
  }

  // Step 2, called with the temporary token from login.
  @Post('verify-otp')
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async verifyOtp(
    @Body() body: OtpVerificationRequestDto,
    @AuthUser() user: UserJwtDetails,
    @Req() req: Request,
  ) {
    // req.ip honours TRUST_PROXY. Informational only, never used to authorize.
    return await this.authService.handleVerifyOtp(user.id, body, {
      ipAddress: req.ip,
      agent: req.headers['user-agent'],
    });
  }

  @Post('resend-otp')
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async resendOtp(@AuthUser() user: UserJwtDetails) {
    return await this.authService.handleResendVerificationCode(user.id);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async profile(@AuthUser() user: UserJwtDetails) {
    return await this.authService.getProfile(user.id);
  }

  @Patch('setup-profile')
  @UseGuards(JwtAuthGuard)
  async setupProfile(
    @AuthUser() user: UserJwtDetails,
    @Body() body: UserRequest,
  ) {
    return await this.authService.handleProfileSetup(user.id, body);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@AuthUser() user: UserJwtDetails) {
    return await this.authService.handleSignOut(user.id);
  }
}
