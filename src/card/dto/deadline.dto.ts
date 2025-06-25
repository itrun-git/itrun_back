import { IsOptional, IsDateString } from 'class-validator';

export class DeadlineDto {
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
