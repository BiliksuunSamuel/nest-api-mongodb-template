import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateUserRequest } from 'src/dtos/user/create.user.request.dto';
import { JwtAuthGuard } from 'src/providers/jwt-auth..guard';
import { UserService } from 'src/services/user.service';

@Controller('api/users')
@ApiTags('Users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Authorization')
  @ApiParam({ name: 'id', type: String })
  async getById(@Param('id') id: string) {
    return await this.userService.getById(id);
  }

  @Get('email/:email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Authorization')
  @ApiParam({ name: 'email', type: String })
  async getByEmail(@Param('email') email: string) {
    return await this.userService.getByEmail(email);
  }

  @Post('register')
  async register(@Body() request: CreateUserRequest) {
    return await this.userService.create(request);
  }
}
