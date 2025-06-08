import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { WorkspaceVisibility } from "../entities/workspace.entity";

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'My Workspace' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: 'private' })
  @IsOptional()
  @IsEnum(WorkspaceVisibility)
  visibility?: WorkspaceVisibility;
}
