import { IsNotEmpty } from 'class-validator';

export class CreateLabelDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  color: string;
}
