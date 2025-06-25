import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { WorkspaceMember } from './workspace-member.entity';
import { Board } from 'src/board/entities/board.entity';

export enum WorkspaceVisibility {
  PRIVATE = 'private',
  PUBLIC = 'public',
}

@Entity('workspaces')
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: false })
  name: string;

  @Column({ type: 'enum', enum: WorkspaceVisibility, default: WorkspaceVisibility.PRIVATE })
  visibility: WorkspaceVisibility;

  @Column({ nullable: true })
  imageUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => WorkspaceMember, (member) => member.workspace)
  members: WorkspaceMember[];

  @OneToMany(() => Board, (board) => board.workspace)
  boards: Board[];
}
