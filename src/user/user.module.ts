import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { WorkspaceMember } from 'src/workspace/entities/workspace-member.entity';
import { WorkspaceService } from 'src/workspace/workspace.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, WorkspaceMember])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}
