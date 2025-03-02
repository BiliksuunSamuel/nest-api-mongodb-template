import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
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
  async login(@Body() req: LoginRequest, @Res() response: Response) {
    const res = await this.authService.login(req);
    response.status(res.code).send(res);
  }

  //profile
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async profile(@AuthUser() user: UserJwtDetails, @Res() response: Response) {
    const res = await this.authService.getUserByEmail(user.email);
    response.status(res.code).send(res);
  }
}
