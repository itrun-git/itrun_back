import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAvatarDto {
  @ApiProperty({ example: '/uploads/avatars/avatar123.png' })
  @IsString()
  avatarUrl: string;
}
