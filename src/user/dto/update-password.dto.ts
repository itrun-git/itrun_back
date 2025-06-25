import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasswordDto {
  @ApiProperty({ example: 'oldPassword123' })
  @IsNotEmpty()
  @IsString()
  oldPassword: string;

  @ApiProperty({ example: 'newSecurePassword123' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  newPassword: string;
}
