import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { Column as BoardColumn } from 'src/column/entities/column.entity';
import { User } from 'src/user/user.entity';
import { Attachment } from './attachment.entity';
import { Comment } from './comment.entity';
import { Label } from 'src/label/entities/label.entity';

@Entity('cards')
export class Card {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date;

  @ManyToMany(() => Label, (label) => label.cards, { cascade: true, eager: false })
  @JoinTable()
  labels: Label[];

  @ManyToMany(() => User)
  @JoinTable()
  members: User[];

  @OneToMany(() => Attachment, (attachment) => attachment.card, { cascade: true })
  attachments: Attachment[];

  @Column({ nullable: true })
  coverPath?: string;

  @Column()
  position: number;

  @ManyToOne(() => BoardColumn, (column) => column.cards, { onDelete: 'CASCADE' })
  column: BoardColumn;

  @OneToMany(() => Comment, (comment) => comment.card, { cascade: true })
  comments: Comment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
