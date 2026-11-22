import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { CustomerRequest } from 'src/dtos/customer/customer.request.dto';
import { UserRole } from 'src/enums';
import { AuthRoles } from 'src/middlewares/auth.roles';
import { JwtAuthGuard } from 'src/providers/jwt-auth..guard';
import { CustomerService } from 'src/services/customer.service';

@Controller('api/customers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('Authorization')
@ApiTags('Customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get(':id')
  @ApiParam({ name: 'id', type: String })
  async getById(@Param('id') id: string) {
    return await this.customerService.getById(id);
  }
  //delete customer : Example  using RBAC (Role-Based Access Control)
  @Delete(':id')
  //adding roles to allow only admin to delete customer
  @AuthRoles(UserRole.Admin)
  @ApiParam({ name: 'id', type: String })
  async delete(@Param('id') id: string) {
    return await this.customerService.delete(id);
  }

  @Get('email/:email')
  @ApiParam({ name: 'email', type: String })
  async getByEmail(@Param('email') email: string) {
    return await this.customerService.getByEmail(email);
  }

  @Post()
  async create(@Body() request: CustomerRequest) {
    return await this.customerService.create(request);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: String })
  async update(@Param('id') id: string, @Body() request: CustomerRequest) {
    return await this.customerService.update(id, request);
  }
}
