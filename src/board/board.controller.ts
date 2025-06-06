import { Body, Controller, Post, Param, UseGuards, Get, Delete, UseInterceptors, UploadedFile, Patch } from '@nestjs/common';
import { BoardService } from './board.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Board } from './entities/board.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/user/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UpdateBoardDto } from './dto/update-board.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspace/:workspaceId/board')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Post()
  @ApiOperation({ summary: 'Create board in workspace (admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Form data with board name and optional image',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Project A' },
        image: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['name'],
    },
  })
  @ApiResponse({ status: 201, description: 'Board successfully created', type: Board })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/board-backgrounds',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async create(@Param('workspaceId') workspaceId: string, @CurrentUser() user: User, @UploadedFile() image: Express.Multer.File, @Body() dto: CreateBoardDto) {
    return this.boardService.create(workspaceId, user, dto, image);
  }

  @Get()
  @ApiOperation({ summary: 'Get all boards in a workspace (only for workspace members)' })
  @ApiResponse({ status: 200, description: 'List of boards in the workspace', type: [Board] })
  async getBoardsInWorkspace(@Param('workspaceId') workspaceId: string, @CurrentUser() user: User): Promise<Board[]> {
    return this.boardService.getAllByWorkspace(workspaceId, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one board by ID (only for board members)' })
  @ApiResponse({ status: 200, description: 'Board found', type: Board })
  async getBoardById(@Param('id') boardId: string, @CurrentUser() user: User): Promise<Board> {
    return this.boardService.getById(boardId, user);
  }
}

// BoardCommonController for common board operations
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('boards')
export class BoardCommonController {
  constructor(private readonly boardService: BoardService) {}

  @Patch(':id')
  @ApiOperation({ summary: 'Update board name or image (for members)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Form with optional name and image',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Updated board name' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/board-backgrounds',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async updateBoard(@Param('id') boardId: string, @CurrentUser() user: User, @UploadedFile() image: Express.Multer.File, @Body() dto: UpdateBoardDto): Promise<Board> {
    return this.boardService.updateBoard(boardId, user, dto, image);
  }

  @Get('favorites')
  @ApiOperation({ summary: 'Get user\'s favorite boards' })
  @ApiResponse({ status: 200, description: 'List of favorite boards', type: [Board] })
  async getFavorites(@CurrentUser() user: User): Promise<Board[]> {
    return this.boardService.getFavoriteBoards(user);
  }

  @Post(':id/favorite')
  @ApiOperation({ summary: 'Add board to favorites' })
  @ApiResponse({ status: 200, description: 'Board added to favorites' })
  async addToFavorites(@Param('id') boardId: string, @CurrentUser() user: User): Promise<{ message: string }> {
    return this.boardService.addToFavorites(boardId, user);
  }

  @Delete(':id/favorite')
  @ApiOperation({ summary: 'Remove board from favorites' })
  @ApiResponse({ status: 200, description: 'Board removed from favorites' })
  async removeFromFavorites(@Param('id') boardId: string, @CurrentUser() user: User): Promise<{ message: string }> {
    return this.boardService.removeFromFavorites(boardId, user);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get last 5 viewed boards by user' })
  @ApiResponse({ status: 200, description: 'List of last viewed boards', type: [Board] })
  async getRecentBoards(@CurrentUser() user: User): Promise<Board[]> {
    return this.boardService.getLastViewedBoards(user);
  }
}

