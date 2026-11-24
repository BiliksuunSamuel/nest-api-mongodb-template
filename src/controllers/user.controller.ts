import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/providers/jwt-auth..guard';
import { UserService } from 'src/services/user.service';

// Accounts are created on first sign-in (POST /api/authentication/login).
@Controller('api/users')
@ApiTags('Users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('Authorization')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('phone/:phoneNumber')
  @ApiParam({ name: 'phoneNumber', type: String })
  async getByPhoneNumber(@Param('phoneNumber') phoneNumber: string) {
    return await this.userService.getByPhoneNumber(phoneNumber);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: String })
  async getById(@Param('id') id: string) {
    return await this.userService.getById(id);
  }
}
