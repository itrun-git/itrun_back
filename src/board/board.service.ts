import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Board } from './entities/board.entity';
import { Repository } from 'typeorm';
import { BoardMember, BoardRole } from './entities/board-member.entity';
import { WorkspaceService } from 'src/workspace/workspace.service';
import { User } from 'src/user/user.entity';
import { CreateBoardDto } from './dto/create-board.dto';
import { Workspace } from 'src/workspace/entities/workspace.entity';
import { WorkspaceMemberRole } from 'src/workspace/entities/workspace-member.entity';
import { FavoriteBoard } from './entities/favorite-board.entity';
import { UpdateBoardDto } from './dto/update-board.dto';

@Injectable()
export class BoardService {
  constructor(
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,

    @InjectRepository(BoardMember)
    private readonly boardMemberRepository: Repository<BoardMember>,

    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,

    @InjectRepository(FavoriteBoard)
    private readonly favoriteBoardRepository: Repository<FavoriteBoard>,
  ) {}

  async create(workspaceId: string, user: User, dto: CreateBoardDto, image?: Express.Multer.File): Promise<Board> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
      relations: ['members', 'members.user'],
    });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const isAdmin = workspace.members.some(
      (member) => member.user.id === user.id && member.role === WorkspaceMemberRole.ADMIN,
    );
    if (!isAdmin) {
      throw new ForbiddenException('Only admin can create a board');
    }

    const imageUrl = image ? `/uploads/board-backgrounds/${image.filename}` : undefined;

    const board = this.boardRepository.create({
      name: dto.name,
      imageUrl,
      workspace,
    });

    await this.boardRepository.save(board);
    await this.boardMemberRepository.save({ board, user, role: BoardRole.ADMIN });

    return this.boardRepository.findOneOrFail({
      where: { id: board.id },
      relations: ['members', 'members.user'],
    });
  }

  async updateBoard(boardId: string, user: User, dto: UpdateBoardDto, image?: Express.Multer.File ): Promise<Board> {
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
      relations: ['members', 'members.user'],
    });
    if (!board) {
      throw new NotFoundException('Board not found');
    }

    const isMember = board.members.some((member) => member.user.id === user.id);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this board');
    }

    if (dto.name) {
      board.name = dto.name;
    }

    if (image) {
      board.imageUrl = `/uploads/board-backgrounds/${image.filename}`;
    }
    return this.boardRepository.save(board);
  }

  async getAllByWorkspace(workspaceId: string, user: User): Promise<Board[]> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
      relations: ['members', 'members.user'],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const isMember = workspace.members.some(
      (member) => member.user.id === user.id,
    );
    if (!isMember) {
      throw new ForbiddenException('Access denied: You are not a member of this workspace');
    }

    return this.boardRepository.find({
      where: { workspace: { id: workspaceId } },
      relations: ['members', 'members.user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getById(boardId: string, user: User): Promise<Board> {
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
      relations: ['members', 'members.user', 'workspace'],
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    const isMember = board.members.some((member) => member.user.id === user.id);
    if (!isMember) {
      throw new ForbiddenException('Access denied: You are not a member of this board');
    }

    await this.boardMemberRepository.update(
      { board: { id: boardId }, user: { id: user.id } },
      { lastViewedAt: new Date() },
    );

    return board;
  }

  async getFavoriteBoards(user: User): Promise<Board[]> {
    const favorites = await this.favoriteBoardRepository.find({
      where: { user: { id: user.id } },
      relations: ['board', 'board.members', 'board.members.user'],
      order: { createdAt: 'DESC' },
    });
    return favorites.map((fav) => fav.board);
  }

  async addToFavorites(boardId: string, user: User): Promise<{ message: string }> {
    const board = await this.boardRepository.findOneBy({ id: boardId });
    if (!board) throw new NotFoundException('Board not found');

    const alreadyExists = await this.favoriteBoardRepository.findOne({
      where: { board: { id: boardId }, user: { id: user.id } },
    });

    if (alreadyExists) {
      throw new BadRequestException('Board is already in favorites');
    }
    await this.favoriteBoardRepository.save({ board, user });
    return { message: 'Board added to favorites' };
  }

  async removeFromFavorites(boardId: string, user: User): Promise<{ message: string }> {
    const favorite = await this.favoriteBoardRepository.findOne({
      where: { board: { id: boardId }, user: { id: user.id } },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }
    await this.favoriteBoardRepository.remove(favorite);
    return { message: 'Board removed from favorites' };
  }

  async getLastViewedBoards(user: User): Promise<Board[]> {
    const boardMemberships = await this.boardMemberRepository.find({
      where: { user: { id: user.id } },
      relations: ['board', 'board.members', 'board.members.user'],
      order: { lastViewedAt: 'DESC' },
      take: 5,
    });
    return boardMemberships.filter((m) => m.lastViewedAt).map((m) => m.board);
  }
}
