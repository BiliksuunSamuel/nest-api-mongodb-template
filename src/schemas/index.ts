import { Prop } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

export class BaseSchema {
  @Prop({ required: true })
  @ApiProperty()
  id: string;

  @Prop({ default: Date.now })
  @ApiProperty()
  createdAt: Date;

  @Prop({ default: null })
  @ApiProperty()
  updatedAt: Date;

  @Prop({ default: null })
  @ApiProperty()
  createdBy: string;

  @Prop({ default: null })
  @ApiProperty()
  updatedBy: string;
}
