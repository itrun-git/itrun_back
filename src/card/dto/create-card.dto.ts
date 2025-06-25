import { IsNotEmpty, IsOptional, IsDateString, IsArray, IsUUID } from 'class-validator';

export class CreateCardDto {
  @IsNotEmpty()
  title: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  labelIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  memberIds?: string[];
}
