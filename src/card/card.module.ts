import { Module } from '@nestjs/common';
import { CardService } from './card.service';
import { CardBoardController, CardController } from './card.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ColumnModule } from 'src/column/column.module';
import { Card } from './entities/card.entity';
import { Column } from 'src/column/entities/column.entity';
import { Board } from 'src/board/entities/board.entity';
import { Label } from 'src/label/entities/label.entity';
import { WorkspaceModule } from 'src/workspace/workspace.module';
import { UserModule } from 'src/user/user.module';
import { Attachment } from './entities/attachment.entity';
import { User } from 'src/user/user.entity';
import { Comment } from './entities/comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Card, Column, Board, Label, User, Attachment, Comment]), ConfigModule, ColumnModule, WorkspaceModule, UserModule],
  controllers: [CardController, CardBoardController],
  providers: [CardService],
  exports: [CardService, TypeOrmModule.forFeature([Card])],
})
export class CardModule {}
