import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { Column as ColumnEntity } from 'src/column/entities/column.entity';
import { User } from 'src/user/user.entity';

@Entity('cards')
export class Card {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column()
  position: number;

  @ManyToOne(() => ColumnEntity, (column) => column.cards, { onDelete: 'CASCADE' })
  column: ColumnEntity;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'card_members',
    joinColumn: { name: 'card_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  members: User[];

//   @OneToMany(() => CardLabel, (label) => label.card, { cascade: true })
//   labels: CardLabel[];

//   @OneToMany(() => CardAttachment, (attachment) => attachment.card, { cascade: true })
//   attachments: CardAttachment[];

  @Column({ nullable: true })
  coverUrl: string;

//   @OneToMany(() => CardComment, (comment) => comment.card, { cascade: true })
//   comments: CardComment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
