import { IsEmail } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class ChangeRegistrationEmailDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  currentEmail: string;

  @ApiProperty({ example: 'newuser@example.com' })
  @IsEmail()
  newEmail: string;
}
