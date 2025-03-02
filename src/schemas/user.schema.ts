import { Prop, Schema } from '@nestjs/mongoose';
import { BaseSchema } from '.';
import { ApiProperty } from '@nestjs/swagger';

@Schema()
export class User extends BaseSchema {
  @Prop()
  @ApiProperty()
  name: string;

  @Prop()
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
}
