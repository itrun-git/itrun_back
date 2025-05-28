import { IsString, MaxLength } from 'class-validator';

export class UpdateWorkspaceNameDto {
  @IsString()
  @MaxLength(50)
  name: string;
}
