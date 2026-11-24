import { Prop, Schema } from '@nestjs/mongoose';
import { BaseSchema } from '.';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/enums';

// The user's profile. Authentication state (tokens, OTP challenge) lives on the
// separate UserAuthSession collection.
@Schema()
export class User extends BaseSchema {
  @Prop({ default: null })
  @ApiProperty()
  name: string;

  // E.164 digits without the "+" (see utils/phone.ts).
  @Prop({ required: true, unique: true, trim: true })
  @ApiProperty()
  phoneNumber: string;

  @Prop({ default: UserRole.Client })
  @ApiProperty()
  role: UserRole;
}
