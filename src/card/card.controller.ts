import { Controller, Post, Patch, Delete, Get, Param,Body, UseGuards, ParseUUIDPipe, UseInterceptors, UploadedFile } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/user/user.entity';
import { CardService } from './card.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';
import { DeadlineDto } from './dto/deadline.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspace/:workspaceId/board/:boardId/column/:columnId/card')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post()
  @ApiOperation({ summary: 'Create card in column' })
  create(@Param('workspaceId') workspaceId: string, @Param('boardId') boardId: string, @Param('columnId') columnId: string, @CurrentUser() user: User, @Body() dto: CreateCardDto) {
    return this.cardService.create(workspaceId, boardId, columnId, user, dto);
  }

  @Patch(':cardId')
  @ApiOperation({ summary: 'Update card' })
  update(@Param('workspaceId') workspaceId: string, @Param('boardId') boardId: string, @Param('columnId') columnId: string, @Param('cardId', ParseUUIDPipe) cardId: string, @CurrentUser() user: User, @Body() dto: UpdateCardDto) {
    return this.cardService.update(workspaceId, boardId, columnId, cardId, user, dto);
  }

  @Delete(':cardId')
  @ApiOperation({ summary: 'Delete card' })
  remove(@Param('workspaceId') workspaceId: string, @Param('boardId') boardId: string, @Param('columnId') columnId: string, @Param('cardId', ParseUUIDPipe) cardId: string, @CurrentUser() user: User) {
    return this.cardService.remove(workspaceId, boardId, columnId, cardId, user);
  }

  @Post(':cardId/move')
  @ApiOperation({ summary: 'Move card to another column or position' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        newColumnId: { type: 'string', format: 'uuid' },
        newPosition: { type: 'number', nullable: true },
      },
      required: ['newColumnId'],
    },
  })
  move(@Param('workspaceId') workspaceId: string, @Param('cardId') cardId: string, @CurrentUser() user: User, @Body() body: { newColumnId: string; newPosition?: number }) {
    return this.cardService.move(workspaceId, cardId, user, body.newColumnId, body.newPosition);
  }

  @Get(':cardId/members')
  @ApiOperation({ summary: 'Get all members of the card' })
  getMembers(@Param('cardId', ParseUUIDPipe) cardId: string) {
    return this.cardService.getMembers(cardId);
  }

  @Post(':cardId/members/:userId')
  @ApiOperation({ summary: 'Add member to the card (admin only)' })
  addMember(@Param('workspaceId') workspaceId: string, @Param('cardId', ParseUUIDPipe) cardId: string, @Param('userId', ParseUUIDPipe) userIdToAdd: string, @CurrentUser() adminUser: User) {
    return this.cardService.addMember(workspaceId, cardId, adminUser, userIdToAdd);
  }

  @Delete(':cardId/members/:userId')
  @ApiOperation({ summary: 'Remove member from the card (admin only)' })
  removeMember(@Param('workspaceId') workspaceId: string, @Param('cardId', ParseUUIDPipe) cardId: string, @Param('userId', ParseUUIDPipe) userIdToRemove: string, @CurrentUser() adminUser: User) {
    return this.cardService.removeMember(workspaceId, cardId, adminUser, userIdToRemove);
  }

  @Post(':cardId/subscribe')
  @ApiOperation({ summary: 'Subscribe current user to the card' })
  subscribeSelf(@Param('cardId', ParseUUIDPipe) cardId: string, @CurrentUser() user: User) {
    return this.cardService.subscribeSelf(cardId, user);
  }

  @Post(':cardId/unsubscribe')
  @ApiOperation({ summary: 'Unsubscribe current user from the card' })
  unsubscribeSelf(@Param('cardId', ParseUUIDPipe) cardId: string, @CurrentUser() user: User) {
    return this.cardService.unsubscribeSelf(cardId, user);
  }

  @Get(':cardId/labels')
  @ApiOperation({ summary: 'Get labels of a card' })
  getLabels(@Param('cardId', ParseUUIDPipe) cardId: string, @CurrentUser() user: User) {
    return this.cardService.getLabels(cardId, user);
  }

  @Post(':cardId/labels/:labelId')
  @ApiOperation({ summary: 'Toggle label on card (add/remove)' })
  toggleLabel(@Param('cardId', ParseUUIDPipe) cardId: string, @Param('labelId', ParseUUIDPipe) labelId: string) {
    return this.cardService.toggleLabel(cardId, labelId);
  }

  @Patch(':cardId/deadline')
  @ApiOperation({ summary: 'Set, update or remove deadline for a card' })
  updateDeadline(@Param('workspaceId') workspaceId: string, @Param('boardId') boardId: string, @Param('columnId') columnId: string, @Param('cardId', ParseUUIDPipe) cardId: string, @Body() dto: DeadlineDto, @CurrentUser() user: User) {
    return this.cardService.updateDeadline(workspaceId, boardId, columnId, cardId, dto, user);
  }

  @Post(':cardId/attachments')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/attachments',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiOperation({ summary: 'Upload attachment to card' })
  uploadAttachment(@Param('workspaceId') workspaceId: string, @Param('boardId') boardId: string, @Param('columnId') columnId: string, @Param('cardId', ParseUUIDPipe) cardId: string, @UploadedFile() file: Express.Multer.File, @CurrentUser() user: User) {
    return this.cardService.uploadAttachment(workspaceId, boardId, columnId, cardId, user, file);
  }

  @Get(':cardId/attachments')
  @ApiOperation({ summary: 'Get all attachments of a card' })
  getAttachments(@Param('cardId', ParseUUIDPipe) cardId: string) {
    return this.cardService.getAttachments(cardId);
  }

  @Delete(':cardId/attachments/:attachmentId')
  @ApiOperation({ summary: 'Delete an attachment from card' })
  deleteAttachment(@Param('workspaceId') workspaceId: string, @Param('cardId', ParseUUIDPipe) cardId: string, @Param('attachmentId', ParseUUIDPipe) attachmentId: string, @CurrentUser() user: User) {
    return this.cardService.deleteAttachment(workspaceId, cardId, attachmentId, user);
  }

  @Get(':cardId/attachments-count')
  @ApiOperation({ summary: 'Get count of attachments on card' })
  getAttachmentCount(@Param('cardId', ParseUUIDPipe) cardId: string) {
    return this.cardService.getAttachmentCount(cardId);
  }

  @Post(':cardId/cover')
  @UseInterceptors(FileInterceptor('file', { dest: './uploads/covers' }))
  @ApiOperation({ summary: 'Upload card cover image' })
  uploadCover(@Param('workspaceId') workspaceId: string, @Param('boardId') boardId: string, @Param('columnId') columnId: string, @Param('cardId') cardId: string, @CurrentUser() user: User, @UploadedFile() file: Express.Multer.File) {
    return this.cardService.uploadCardCover(workspaceId, boardId, columnId, cardId, file, user);
  }

  @Delete(':cardId/cover')
  @ApiOperation({ summary: 'Delete card cover image' })
  deleteCover(@Param('workspaceId') workspaceId: string, @Param('boardId') boardId: string, @Param('columnId') columnId: string, @Param('cardId') cardId: string, @CurrentUser() user: User) {
    return this.cardService.deleteCardCover(workspaceId, boardId, columnId, cardId, user);
  }

  @Post()
  @ApiOperation({ summary: 'Add comment to card' })
  addComment(@Param('workspaceId') workspaceId: string, @Param('boardId') boardId: string, @Param('columnId') columnId: string, @Param('cardId', ParseUUIDPipe) cardId: string, @CurrentUser() user: User, @Body() dto: { text: string }) {
    return this.cardService.addComment(workspaceId, boardId, columnId, cardId, user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all comments of a card' })
  getComments(@Param('workspaceId') workspaceId: string, @Param('boardId') boardId: string, @Param('columnId') columnId: string, @Param('cardId', ParseUUIDPipe) cardId: string, @CurrentUser() user: User) {
    return this.cardService.getComments(workspaceId, boardId, columnId, cardId, user);
  }

  @Delete(':commentId')
  @ApiOperation({ summary: 'Delete comment (admin only)' })
  deleteComment(@Param('workspaceId') workspaceId: string, @Param('commentId', ParseUUIDPipe) commentId: string, @CurrentUser() user: User) {
    return this.cardService.deleteComment(workspaceId, commentId, user);
  }
}


// CardBoardController for board-level card operations
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspace/:workspaceId/board/:boardId')
export class CardBoardController {
  constructor(private readonly cardService: CardService) {}

  @Get('cards')
  @ApiOperation({ summary: 'Get board with columns (id only) and full cards' })
  async findAllByBoard(@Param('workspaceId') workspaceId: string, @Param('boardId') boardId: string, @CurrentUser() user: User) {
    return this.cardService.findAllByBoard(boardId, workspaceId, user);
  }

  @Patch('column/:sourceColumnId/move-all/:targetColumnId')
  @ApiOperation({ summary: 'Move all cards from one column to another' })
  moveAllCardsToAnotherColumn(@Param('workspaceId') workspaceId: string, @Param('boardId') boardId: string, @Param('sourceColumnId') sourceColumnId: string, @Param('targetColumnId') targetColumnId: string, @CurrentUser() user: User) {
    return this.cardService.moveAllCardsToAnotherColumn(workspaceId, boardId, sourceColumnId, targetColumnId, user);
  }
}
