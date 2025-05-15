import { IsEmail, IsNotEmpty, IsOptional, IsString, IsEnum, MinLength, MaxLength } from 'class-validator';
import { UserPurpose } from '../user.entity';

export class CreateUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  passwordHash: string;

  @IsNotEmpty({ message: 'Full name is required' })
  @IsString({ message: 'Full name must be a string' })
  fullName: string;

  @IsOptional()
  @IsString({ message: 'Avatar URL must be a string' })
  @MaxLength(255, { message: 'Avatar URL is too long' })
  avatarUrl?: string;

  @IsEnum(UserPurpose, { message: 'Purpose must be one of: personal, team, events, other' })
  purpose: UserPurpose;

  @IsOptional()
  emailVerified?: boolean;

  @IsOptional()
  verificationToken?: string;

  @IsOptional()
  isActive?: boolean;
}
