import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CustomerRequest } from 'src/dtos/customer/customer.request.dto';
import { UserRole } from 'src/enums';
import { AuthRoles } from 'src/middlewares/auth.roles';
import { JwtAuthGuard } from 'src/providers/jwt-auth..guard';
import { CustomerService } from 'src/services/customer.service';

@Controller('api/customers')
@ApiTags('Customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get(':id')
  @ApiParam({ name: 'id', type: String })
  async getById(@Param('id') id: string, @Res() response: Response) {
    const res = await this.customerService.getById(id);
    response.status(res.code).send(res);
  }
  //delete customer : Example  using RBAC (Role-Based Access Control)
  @Get('delete/:id')
  @UseGuards(JwtAuthGuard)
  //adding roles to allow only admin to delete customer
  @AuthRoles(UserRole.Admin)
  @ApiParam({ name: 'id', type: String })
  async delete(@Param('id') id: string, @Res() response: Response) {
    const res = await this.customerService.delete(id);
    response.status(res.code).send(res);
  }

  @Get('email/:email')
  @ApiParam({ name: 'email', type: String })
  async getByEmail(@Param('email') email: string, @Res() response: Response) {
    const res = await this.customerService.getByEmail(email);
    response.status(res.code).send(res);
  }

  @Post()
  async create(@Body() request: CustomerRequest, @Res() response: Response) {
    const res = await this.customerService.create(request);
    response.status(res.code).send(res);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: String })
  async update(
    @Param('id') id: string,
    @Body() request: CustomerRequest,
    @Res() response: Response,
  ) {
    const res = await this.customerService.update(id, request);
    response.status(res.code).send(res);
  }
}
