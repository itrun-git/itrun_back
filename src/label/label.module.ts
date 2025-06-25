import { Module } from '@nestjs/common';
import { LabelService } from './label.service';
import { LabelController } from './label.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Label } from './entities/label.entity';
import { ConfigModule } from '@nestjs/config';
import { Card } from 'src/card/entities/card.entity';
import { CardService } from 'src/card/card.service';
import { CardModule } from 'src/card/card.module';

@Module({
  imports: [TypeOrmModule.forFeature([Label, Card]), ConfigModule, CardModule],
  controllers: [LabelController],
  providers: [LabelService],
})
export class LabelModule {}
