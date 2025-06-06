import { Module } from '@nestjs/common';
import { BoardService } from './board.service';
import { BoardCommonController, BoardController } from './board.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Board } from './entities/board.entity';
import { FavoriteBoard } from './entities/favorite-board.entity';
import { BoardMember } from './entities/board-member.entity';
import { WorkspaceModule } from 'src/workspace/workspace.module';

@Module({
  imports: [TypeOrmModule.forFeature([Board, FavoriteBoard, BoardMember]), ConfigModule, WorkspaceModule],
  controllers: [BoardController, BoardCommonController],
  providers: [BoardService],
})
export class BoardModule {}
