import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Card } from 'src/card/entities/card.entity';

@Entity('labels')
export class Label {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  color: string;

  @ManyToMany(() => Card, (card) => card.labels)
  cards: Card[];
}