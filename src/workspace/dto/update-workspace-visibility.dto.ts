import { IsEnum } from 'class-validator';
import { WorkspaceVisibility } from '../entities/workspace.entity';

export class UpdateWorkspaceVisibilityDto {
  @IsEnum(WorkspaceVisibility)
  visibility: WorkspaceVisibility;
}
