import { IsEmail, IsNotEmpty } from 'class-validator';

// This DTO is used to validate the email address provided by the user
export class EmailCheckDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
