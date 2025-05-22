import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from 'typeorm';
import { Board } from './board.entity';
import { User } from 'src/user/user.entity';

export enum BoardRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Entity('board_members')
export class BoardMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Board, (board) => board.members, { eager: false, onDelete: 'CASCADE' })
  board: Board;

  @Column({ type: 'enum', enum: BoardRole, default: BoardRole.MEMBER })
  role: BoardRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
