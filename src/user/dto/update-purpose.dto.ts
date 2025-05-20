import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserPurpose } from '../user.entity';

export class UpdatePurposeDto {
  @ApiProperty({ enum: UserPurpose, example: UserPurpose.PERSONAL })
  @IsEnum(UserPurpose)
  purpose: UserPurpose;
}
