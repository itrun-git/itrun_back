import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, Unique } from 'typeorm';
import { Workspace } from './workspace.entity';
import { User } from 'src/user/user.entity';

export enum WorkspaceMemberRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Entity('workspace_members')
@Unique(['user', 'workspace'])
export class WorkspaceMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Workspace, { eager: false, onDelete: 'CASCADE' })
  workspace: Workspace;

  @Column({ type: 'enum', enum: WorkspaceMemberRole, default: WorkspaceMemberRole.MEMBER })
  role: WorkspaceMemberRole;

  @CreateDateColumn()
  createdAt: Date;
}
