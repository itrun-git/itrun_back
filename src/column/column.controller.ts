import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ColumnService } from './column.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/user/user.entity';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';
import { Column } from './entities/column.entity';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspace/:workspaceId/board/:boardId/column')
export class ColumnController {
  constructor(private readonly columnService: ColumnService) {}
  
  @Post()
  @ApiOperation({ summary: 'Create a column in board' })
  @ApiParam({ name: 'workspaceId', type: 'string' })
  @ApiParam({ name: 'boardId', type: 'string' })
  @ApiBody({ type: CreateColumnDto })
  create(@Param('workspaceId') workspaceId: string, @Param('boardId') boardId: string, @CurrentUser() user: User, @Body() dto: CreateColumnDto) {
    return this.columnService.create(workspaceId, boardId, user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all columns of a board' })
  @ApiParam({ name: 'workspaceId', type: 'string' })
  @ApiParam({ name: 'boardId', type: 'string' })
  @ApiResponse({ status: 200, type: [Column] })
  findAll(@Param('workspaceId') workspaceId: string, @Param('boardId') boardId: string, @CurrentUser() user: User) {
    return this.columnService.findAll(workspaceId, boardId, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update column name' })
  @ApiParam({ name: 'workspaceId', type: 'string' })
  @ApiParam({ name: 'boardId', type: 'string' })
  @ApiParam({ name: 'id', type: 'string', description: 'Column ID' })
  @ApiBody({ type: UpdateColumnDto })
  update(@Param('workspaceId') workspaceId: string, @Param('boardId') boardId: string, @Param('id', ParseUUIDPipe) columnId: string, @CurrentUser() user: User, @Body() dto: UpdateColumnDto) {
    return this.columnService.update(workspaceId, boardId, columnId, user, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete column' })
  @ApiParam({ name: 'workspaceId', type: 'string' })
  @ApiParam({ name: 'boardId', type: 'string' })
  @ApiParam({ name: 'id', type: 'string', description: 'Column ID' })
  @ApiResponse({ status: 200, description: 'Column deleted' })
  remove(@Param('workspaceId') workspaceId: string, @Param('boardId') boardId: string, @Param('id', ParseUUIDPipe) columnId: string, @CurrentUser() user: User) {
    return this.columnService.remove(workspaceId, boardId, columnId, user);
  }

  @Post(':id/move')
  @ApiOperation({ summary: 'Move column to new position' })
  @ApiParam({ name: 'workspaceId', type: 'string' })
  @ApiParam({ name: 'boardId', type: 'string' })
  @ApiParam({ name: 'id', type: 'string', description: 'Column ID' })
  @ApiBody({ schema: { example: { newPosition: 2 } } })
  @ApiResponse({ status: 200, type: [Column] })
  move(@Param('workspaceId') workspaceId: string, @Param('boardId') boardId: string, @Param('id', ParseUUIDPipe) columnId: string, @CurrentUser() user: User, @Body() body: { newPosition: number }) {
    return this.columnService.move(workspaceId, boardId, columnId, user, body.newPosition);
  }

  @Post(':id/copy')
  @ApiOperation({ summary: 'Copy column with cards' })
  @ApiParam({ name: 'workspaceId', type: 'string' })
  @ApiParam({ name: 'boardId', type: 'string' })
  @ApiParam({ name: 'id', type: 'string', description: 'Column ID' })
  @ApiResponse({ status: 201, type: Column })
  copy(@Param('workspaceId') workspaceId: string, @Param('boardId') boardId: string, @Param('id', ParseUUIDPipe) columnId: string, @CurrentUser() user: User) {
    return this.columnService.copy(workspaceId, boardId, columnId, user);
  }
}
