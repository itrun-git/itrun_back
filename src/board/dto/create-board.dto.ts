import { IsNotEmpty, IsOptional, IsString, IsUUID, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBoardDto {
  @ApiProperty({ example: 'Marketing Board' })
  @IsNotEmpty()
  @IsString()
  name: string;
}
