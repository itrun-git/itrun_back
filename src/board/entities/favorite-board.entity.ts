import { User } from "src/user/user.entity";
import { CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Board } from "./board.entity";

@Entity('favorite_boards')
export class FavoriteBoard {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, {eager: false, onDelete: 'CASCADE'})
    user: User;

    @ManyToOne(() => Board, {eager: false, onDelete: 'CASCADE'})
    board: Board;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}