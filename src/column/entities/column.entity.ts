import { Entity, PrimaryGeneratedColumn, Column as DBColumn, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Board } from 'src/board/entities/board.entity';
import { Exclude } from 'class-transformer';
import { Card } from 'src/card/entities/card.entity';

@Entity('columns')
export class Column {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @DBColumn()
  name: string;

  @DBColumn()
  position: number;

  @ManyToOne(() => Board, (board) => board.columns, { onDelete: 'CASCADE' })
  board: Board;

  @OneToMany(() => Card, (card) => card.column, { cascade: true })
  cards: Card[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
