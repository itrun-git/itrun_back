import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Card } from './card.entity';

@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string;

  @Column()
  path: string;

  @ManyToOne(() => Card, (card) => card.attachments, { onDelete: 'CASCADE' })
  card: Card;
}
