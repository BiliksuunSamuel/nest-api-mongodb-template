import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CreateUserRequest } from 'src/dtos/user/create.user.request.dto';
import { UserService } from 'src/services/user.service';

@Controller('api/users')
@ApiTags('Users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  @ApiParam({ name: 'id', type: String })
  async getById(@Param('id') id: string, @Res() response: Response) {
    const res = await this.userService.getById(id);
    response.status(res.code).send(res);
  }

  @Get('email/:email')
  @ApiParam({ name: 'email', type: String })
  async getByEmail(@Param('email') email: string, @Res() response: Response) {
    const res = await this.userService.getByEmail(email);
    response.status(res.code).send(res);
  }

  @Post('register')
  async register(
    @Body() request: CreateUserRequest,
    @Res() response: Response,
  ) {
    const res = await this.userService.create(request);
    response.status(res.code).send(res);
  }
}
