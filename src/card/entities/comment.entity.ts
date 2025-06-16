import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from 'src/user/user.entity';
import { Card } from './card.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  text: string;

  @ManyToOne(() => User, { eager: true })
  author: User;

  @ManyToOne(() => Card, (card) => card.comments, { onDelete: 'CASCADE' })
  card: Card;

  @CreateDateColumn()
  createdAt: Date;
}
