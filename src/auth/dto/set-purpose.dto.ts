import { IsEnum, IsUUID } from 'class-validator';
import { UserPurpose } from 'src/user/user.entity';

export class SetPurposeDto {
  @IsUUID()
  userId: string;

  @IsEnum(UserPurpose)
  purpose: UserPurpose;
}
