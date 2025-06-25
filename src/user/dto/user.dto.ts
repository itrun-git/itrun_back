import { ApiProperty } from '@nestjs/swagger';
import { UserPurpose } from '../user.entity';

export class UserDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ApiProperty({ example: '/uploads/avatars/avatar.jpg', required: false })
  avatarUrl?: string;

  @ApiProperty({ enum: UserPurpose, example: UserPurpose.PERSONAL })
  purpose: UserPurpose;

  @ApiProperty({ example: true })
  emailVerified: boolean;

  @ApiProperty({ example: true })
  isActive: boolean;
}
