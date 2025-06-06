import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, OneToMany } from 'typeorm';
import { Workspace } from 'src/workspace/entities/workspace.entity';
import { BoardMember } from './board-member.entity';

@Entity('boards')
export class Board {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @ManyToOne(() => Workspace, (workspace) => workspace.boards, { nullable: false, onDelete: 'CASCADE'})
  workspace: Workspace;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
  
  @OneToMany(() => BoardMember, (member) => member.board, { eager: true })
  members: BoardMember[];

}
