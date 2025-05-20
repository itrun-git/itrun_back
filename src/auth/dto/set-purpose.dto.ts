import { IsEnum, IsUUID } from 'class-validator';
import { UserPurpose } from 'src/user/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export class SetPurposeDto {
  @ApiProperty({ example: 'user-uuid', description: 'User UUID' })
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: UserPurpose, example: UserPurpose.PERSONAL, description: 'New purpose for the user' })
  @IsEnum(UserPurpose)
  purpose: UserPurpose;
}
