import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LoginRequest } from 'src/dtos/auth/login.request.dto';
import { UserJwtDetails } from 'src/dtos/auth/user.jwt.details';
import { AuthUser } from 'src/extensions/auth.extensions';
import { JwtAuthGuard } from 'src/providers/jwt-auth..guard';
import { AuthService } from 'src/services/auth.service';

@Controller('api/authentication')
@ApiTags('Authentication')
@ApiBearerAuth('Authorization')
export class AuthenticationController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() req: LoginRequest) {
    return await this.authService.login(req);
  }

  //profile
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async profile(@AuthUser() user: UserJwtDetails) {
    return await this.authService.getUserByEmail(user.email);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@AuthUser() user: UserJwtDetails) {
    return await this.authService.logout(user);
  }
}
