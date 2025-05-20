import { IsEmail, IsNotEmpty, IsOptional, IsString, IsEnum, MinLength, MaxLength } from 'class-validator';
import { UserPurpose } from '../user.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ example: 'strongPassword123', description: 'User password', minLength: 8 })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  passwordHash: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  @IsNotEmpty({ message: 'Full name is required' })
  @IsString({ message: 'Full name must be a string' })
  fullName: string;

  @ApiPropertyOptional({ example: '/uploads/avatars/avatar.png', description: 'URL of the user avatar', maxLength: 255 })
  @IsOptional()
  @IsString({ message: 'Avatar URL must be a string' })
  @MaxLength(255, { message: 'Avatar URL is too long' })
  avatarUrl?: string;

  @ApiProperty({ enum: UserPurpose, example: UserPurpose.PERSONAL, description: 'Purpose of using the app' })
  @IsEnum(UserPurpose, { message: 'Purpose must be one of: personal, team, events, other' })
  purpose: UserPurpose;

  @ApiPropertyOptional({ example: false, description: 'Is email verified' })
  @IsOptional()
  emailVerified?: boolean;

  @ApiPropertyOptional({ example: 'token-uuid', description: 'Email verification token' })
  @IsOptional()
  verificationToken?: string;

  @ApiPropertyOptional({ example: true, description: 'Is user active' })
  @IsOptional()
  isActive?: boolean;
}
