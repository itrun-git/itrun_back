import { Module } from '@nestjs/common';
import { ColumnService } from './column.service';
import { ColumnController } from './column.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { BoardModule } from 'src/board/board.module';
import { Column } from './entities/column.entity';
import { Board } from 'src/board/entities/board.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Column, Board]), ConfigModule, BoardModule],
  controllers: [ColumnController],
  providers: [ColumnService],
})
export class ColumnModule {}
