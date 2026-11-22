import { Prop, Schema } from '@nestjs/mongoose';
import { BaseSchema } from '.';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/enums';

@Schema()
export class User extends BaseSchema {
  @Prop()
  @ApiProperty()
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  @ApiProperty()
  email: string;

  @Prop()
  @ApiProperty()
  password: string;

  @Prop({ default: [] })
  @ApiProperty()
  tokenIds: string[];

  @Prop({ default: false })
  @ApiProperty()
  authenticated: boolean;

  @Prop({ default: UserRole.Client })
  @ApiProperty()
  role: UserRole;
}
