import { Entity, PrimaryGeneratedColumn, Column as DBColumn, ManyToOne, CreateDateColumn, OneToMany } from 'typeorm';
import { Workspace } from 'src/workspace/entities/workspace.entity';
import { BoardMember } from './board-member.entity';
import { Column } from 'src/column/entities/column.entity';

@Entity('boards')
export class Board {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @DBColumn({ nullable: false })
  name: string;

  @DBColumn({ nullable: true })
  imageUrl?: string;

  @ManyToOne(() => Workspace, (workspace) => workspace.boards, { nullable: false, onDelete: 'CASCADE'})
  workspace: Workspace;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
  
  @OneToMany(() => BoardMember, (member) => member.board, { eager: true })
  members: BoardMember[];

  @OneToMany(() => Column, (column) => column.board, { cascade: true })
  columns: Column[];
}
