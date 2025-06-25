import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateBoardDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;
}