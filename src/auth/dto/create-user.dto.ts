import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';

// This DTO is used to validate the data provided by the user when creating a new account
export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @MinLength(8)
  password: string;
}
