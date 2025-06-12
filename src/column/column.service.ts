import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Column } from './entities/column.entity';
import { Repository } from 'typeorm';
import { User } from 'src/user/user.entity';
import { Board } from 'src/board/entities/board.entity';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';

@Injectable()
export class ColumnService {
  constructor(
    @InjectRepository(Column)
    private readonly columnRepository: Repository<Column>,

    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
  ) {}

  async create(workspaceId: string, boardId: string, user: User, dto: CreateColumnDto): Promise<Column> {
    const board = await this.boardRepository.findOne({
      where: { id: boardId, workspace: { id: workspaceId } },
      relations: ['members', 'workspace'],
    });

    if (!board) throw new NotFoundException('Board not found');
    const isMember = board.members.some(m => m.user.id === user.id);
    if (!isMember) throw new ForbiddenException('Access denied');

    const lastPosition = await this.columnRepository
      .createQueryBuilder('column')
      .where('column.boardId = :boardId', { boardId })
      .orderBy('column.position', 'DESC')
      .getOne();

    const newColumn = this.columnRepository.create({
      name: dto.name,
      position: lastPosition ? lastPosition.position + 1 : 0,
      board,
    });

    return this.columnRepository.save(newColumn);
  }

  async findAll(workspaceId: string, boardId: string, user: User): Promise<Column[]> {
    const board = await this.boardRepository.findOne({
      where: { id: boardId, workspace: { id: workspaceId } },
      relations: ['members'],
    });
    if (!board) throw new NotFoundException('Board not found');

    const isMember = board.members.some(m => m.user.id === user.id);
    if (!isMember) throw new ForbiddenException('Access denied');

    return this.columnRepository.find({
      where: { board: { id: boardId } },
      order: { position: 'ASC' },
      relations: ['cards'], // позже добавим cards
    });
  }

  async update(workspaceId: string, boardId: string, columnId: string, user: User, dto: UpdateColumnDto): Promise<Column> {
    const column = await this.columnRepository.findOne({
      where: { id: columnId, board: { id: boardId, workspace: { id: workspaceId } } },
      relations: ['board', 'board.members'],
    });

    if (!column) throw new NotFoundException('Column not found');
    const isMember = column.board.members.some(m => m.user.id === user.id);
    if (!isMember) throw new ForbiddenException('Access denied');

    column.name = dto.name ?? column.name;

    return this.columnRepository.save(column);
  }

  async remove(workspaceId: string, boardId: string, columnId: string, user: User) {
    const column = await this.columnRepository.findOne({
      where: { id: columnId, board: { id: boardId, workspace: { id: workspaceId } } },
      relations: ['board', 'board.members'],
    });

    if (!column) throw new NotFoundException('Column not found');
    const isMember = column.board.members.some(m => m.user.id === user.id);
    if (!isMember) throw new ForbiddenException('Access denied');

    return this.columnRepository.remove(column);
  }

  async move(workspaceId: string, boardId: string, columnId: string, user: User, newPosition: number): Promise<Column[]> {
    const columns = await this.columnRepository.find({
      where: { board: { id: boardId, workspace: { id: workspaceId } } },
      order: { position: 'ASC' },
      relations: ['board', 'board.members'],
    });

    const column = columns.find(c => c.id === columnId);
    if (!column) throw new NotFoundException('Column not found');

    const isMember = column.board.members.some(m => m.user.id === user.id);
    if (!isMember) throw new ForbiddenException('Access denied');

    columns.splice(columns.indexOf(column), 1);
    columns.splice(newPosition, 0, column);

    for (let i = 0; i < columns.length; i++) {
      columns[i].position = i;
    }

    await this.columnRepository.save(columns);
    return columns;
  }

  async copy(workspaceId: string, boardId: string, columnId: string, user: User): Promise<Column> {
    const column = await this.columnRepository.findOne({
      where: { id: columnId, board: { id: boardId, workspace: { id: workspaceId } } },
      relations: ['board', 'board.members', 'cards'], // cards позже
    });

    if (!column) throw new NotFoundException('Column not found');
    const isMember = column.board.members.some(m => m.user.id === user.id);
    if (!isMember) throw new ForbiddenException('Access denied');

    const maxPosition = await this.columnRepository
      .createQueryBuilder('column')
      .where('column.boardId = :boardId', { boardId })
      .orderBy('column.position', 'DESC')
      .getOne();

    const cloned = this.columnRepository.create({
      name: column.name + ' (Copy)',
      position: (maxPosition?.position ?? 0) + 1,
      board: column.board,
    });

    return this.columnRepository.save(cloned);
  }
}
