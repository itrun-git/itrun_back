import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { User } from 'src/user/user.entity';
import { WorkspaceService } from '../workspace/workspace.service';
import { Card } from './entities/card.entity';
import { Column } from 'src/column/entities/column.entity';
import { Label } from 'src/label/entities/label.entity';
import { Board } from 'src/board/entities/board.entity';
import { DeadlineDto } from './dto/deadline.dto';
import { Attachment } from './entities/attachment.entity';
import { unlink } from 'fs';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './entities/comment.entity';

@Injectable()
export class CardService {
  constructor(
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,

    @InjectRepository(Column)
    private readonly columnRepository: Repository<Column>,

    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Label)
    private readonly labelRepository: Repository<Label>,

    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,

    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,

    private readonly workspaceService: WorkspaceService,
  ) {}

  async create(workspaceId: string, boardId: string, columnId: string, user: User, dto: CreateCardDto) {
    await this.workspaceService.checkAccess(workspaceId, user.id);

    const column = await this.columnRepository.findOne({where: { id: columnId }, relations: ['board'],});
    if (!column || column.board.id !== boardId) {
      throw new NotFoundException('Column not found in this board');
    }

    const maxPosition = await this.cardRepository
      .createQueryBuilder('card')
      .where('card.columnId = :columnId', { columnId })
      .select('MAX(card.position)', 'max')
      .getRawOne();

    let members: User[] = [];
    if (dto.memberIds?.length) {
      members = await this.userRepository.findByIds(dto.memberIds);
    }

    let labels: Label[] = [];
    if (dto.labelIds?.length) {
      labels = await this.labelRepository.findByIds(dto.labelIds);
    }

    const card = this.cardRepository.create({
        title: dto.title,
        description: dto.description || '',
        dueDate: dto.dueDate,
        column,
        position: (maxPosition.max || 0) + 1,
        members,
        labels,
    });

    return this.cardRepository.save(card);
  }   

  async update(workspaceId: string, boardId: string, columnId: string, cardId: string, user: User, dto: UpdateCardDto) {
    await this.workspaceService.checkAccess(workspaceId, user.id);

    const card = await this.cardRepository.findOne({ where: { id: cardId }, relations: ['column', 'column.board'] });
    if (!card || card.column.id !== columnId || card.column.board.id !== boardId) {
      throw new NotFoundException('Card not found');
    }

    Object.assign(card, dto);
    return this.cardRepository.save(card);
  }

  async remove(workspaceId: string, boardId: string, columnId: string, cardId: string, user: User) {
    await this.workspaceService.checkAccess(workspaceId, user.id);

    const isAdmin = await this.workspaceService.isAdmin(workspaceId, user);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can delete cards');
    }

    const card = await this.cardRepository.findOne({ where: { id: cardId }, relations: ['column', 'column.board'] });
    if (!card || card.column.id !== columnId || card.column.board.id !== boardId) {
      throw new NotFoundException('Card not found');
    }

    return this.cardRepository.remove(card);
  }

  async findAllByBoard(boardId: string, workspaceId: string, user: User) {
  await this.workspaceService.checkAccess(workspaceId, user.id);

  const board = await this.boardRepository
    .createQueryBuilder('board')
    .leftJoinAndSelect('board.columns', 'column')
    .leftJoinAndSelect('column.cards', 'card')
    .select([
      'board.id',
      'column.id',
      'card'
    ])
    .where('board.id = :boardId', { boardId })
    .getOne();

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return {
      id: board.id,
      columns: board.columns.map(column => ({
        id: column.id,
        cards: column.cards,
      })),
    };
  }

  async completeCard(cardId: string): Promise<Card> {
    const card = await this.cardRepository.findOne({ where: { id: cardId } });
    if (!card) {
      throw new NotFoundException('Card not found');
    }

    card.isCompleted = true;
    return this.cardRepository.save(card);
  }

  async uncompleteCard(cardId: string): Promise<Card> {
    const card = await this.cardRepository.findOne({ where: { id: cardId } });
    if (!card) {
      throw new NotFoundException('Card not found');
    }

    card.isCompleted = false;
    return this.cardRepository.save(card);
  }

  async move(workspaceId: string, cardId: string, user: User, newColumnId: string, newPosition?: number) {
    await this.workspaceService.checkAccess(workspaceId, user.id);

    const card = await this.cardRepository.findOne({ where: { id: cardId }, relations: ['column'] });
    if (!card) throw new NotFoundException('Card not found');

    const oldColumnId = card.column.id;
    const oldPosition = card.position;

    if (oldColumnId !== newColumnId) {
      const cardsToShift = await this.cardRepository
        .createQueryBuilder('card')
        .where('card.columnId = :oldColumnId', { oldColumnId })
        .andWhere('card.position > :oldPosition', { oldPosition })
        .orderBy('card.position', 'ASC')
        .getMany();

      for (const c of cardsToShift) {
        c.position -= 1;
        await this.cardRepository.save(c);
      }
    } else if (newPosition !== undefined && newPosition !== oldPosition) {
      const cardsToShift = await this.cardRepository
        .createQueryBuilder('card')
        .where('card.columnId = :oldColumnId', { oldColumnId })
        .andWhere('card.id != :cardId', { cardId })
        .getMany();

      if (newPosition < oldPosition) {
        for (const c of cardsToShift) {
          if (c.position >= newPosition && c.position < oldPosition) {
            c.position += 1;
            await this.cardRepository.save(c);
          }
        }
      } else {
        for (const c of cardsToShift) {
          if (c.position > oldPosition && c.position <= newPosition) {
            c.position -= 1;
            await this.cardRepository.save(c);
          }
        }
      }
    }

    if (newPosition === undefined || newPosition === null) {
      const maxPositionCard = await this.cardRepository
        .createQueryBuilder('card')
        .where('card.columnId = :newColumnId', { newColumnId })
        .orderBy('card.position', 'DESC')
        .getOne();

      newPosition = maxPositionCard ? maxPositionCard.position + 1 : 0;
    }

    card.column.id = newColumnId;
    card.position = newPosition;

    await this.cardRepository.save(card);

    return card;
  }

  async getMembers(cardId: string): Promise<User[]> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['members'],
    });
    if (!card) {
      throw new NotFoundException('Card not found');
    }
    return card.members;
  }

  async addMember(workspaceId: string, cardId: string, user: User, userIdToAdd: string): Promise<User[]> {
    const isAdmin = await this.workspaceService.isAdmin(workspaceId, user);
    if (!isAdmin) {
      throw new ForbiddenException('Only admin can remove members from card');
    }

    await this.workspaceService.checkAccess(workspaceId, user.id)

    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['members'],
    });
    if (!card) {
      throw new NotFoundException('Card not found');
    }

    if (card.members.find(member => member.id === userIdToAdd)) {
      throw new BadRequestException('User already a member of the card');
    }

    const userToAdd = await this.userRepository.findOneBy({ id: userIdToAdd });
    if (!userToAdd) {
      throw new NotFoundException('User to add not found');
    }

    card.members.push(userToAdd);
    await this.cardRepository.save(card);

    return card.members;
  }

  async removeMember(workspaceId: string, cardId: string, adminUser: User, userIdToRemove: string): Promise<User[]> {
    const isAdmin = await this.workspaceService.isAdmin(workspaceId, adminUser);
    if (!isAdmin) {
      throw new ForbiddenException('Only workspace admins can remove members from card');
    }

    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['members'],
    });
    if (!card) {
      throw new NotFoundException('Card not found');
    }

    card.members = card.members.filter(member => member.id !== userIdToRemove);
    await this.cardRepository.save(card);

    return card.members;
  }

  async subscribeSelf(cardId: string, user: User): Promise<User[]> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['members'],
    });
    if (!card) {
      throw new NotFoundException('Card not found');
    }

    if (card.members.find(member => member.id === user.id)) {
      throw new BadRequestException('User already a member of the card');
    }

    card.members.push(user);
    await this.cardRepository.save(card);

    return card.members;
  }

  async unsubscribeSelf(cardId: string, user: User): Promise<User[]> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['members'],
    });
    if (!card) {
      throw new NotFoundException('Card not found');
    }

    card.members = card.members.filter(member => member.id !== user.id);
    await this.cardRepository.save(card);

    return card.members;
  }

  async getLabels(cardId: string, user: User): Promise<Label[]> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: ['labels', 'column', 'column.board'],
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    const workspaceId = card.column.board.workspace.id;
    await this.workspaceService.checkAccess(workspaceId, user.id);

    return card.labels;
  }

  async toggleLabel(cardId: string, labelId: string): Promise<Label[]> {
    const card = await this.cardRepository.findOne({
        where: { id: cardId },
        relations: ['labels'],
    });

    if (!card) {
        throw new NotFoundException('Card not found');
    }

    const label = await this.labelRepository.findOneBy({ id: labelId });
    if (!label) {
        throw new NotFoundException('Label not found');
    }

    const hasLabel = card.labels.some((l) => l.id === labelId);
    if (hasLabel) {
        card.labels = card.labels.filter((l) => l.id !== labelId);
    } else {
        card.labels.push(label);
    }

    await this.cardRepository.save(card);
    return card.labels;
  }

  async updateDeadline(workspaceId: string, boardId: string, columnId: string, cardId: string, dto: DeadlineDto, user: User) {
    await this.workspaceService.checkAccess(workspaceId, user.id);

    const card = await this.cardRepository.findOne({
      where: { id: cardId, column: { id: columnId, board: { id: boardId } } },
      relations: ['column', 'column.board'],
    });

    if (!card) {
      throw new NotFoundException('Card not found in this column and board');
    }

    card.dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;
    return this.cardRepository.save(card);
  }

  async uploadAttachment(workspaceId: string, boardId: string, columnId: string, cardId: string, user: User, file: Express.Multer.File) {
    await this.workspaceService.checkAccess(workspaceId, user.id);

    const card = await this.cardRepository.findOne({
      where: { id: cardId, column: { id: columnId, board: { id: boardId } } },
      relations: ['column', 'column.board'],
    });

    if (!card) throw new NotFoundException('Card not found');

    const newAttachment = this.attachmentRepository.create({
      filename: file.originalname,
      path: file.path,
      card,
    });

    return this.attachmentRepository.save(newAttachment);
  }

  async getAttachments(cardId: string) {
    const card = await this.cardRepository.findOne({ where: { id: cardId }, relations: ['attachments'] });
    if (!card) throw new NotFoundException('Card not found');

    return card.attachments;
  }

  async deleteAttachment(workspaceId: string, cardId: string, attachmentId: string, user: User) {
    const attachment = await this.attachmentRepository.findOne({
      where: { id: attachmentId },
      relations: ['card', 'card.column', 'card.column.board'],
    });

    if (!attachment || attachment.card.id !== cardId) {
      throw new NotFoundException('Attachment not found in this card');
    }
    await this.workspaceService.checkAccess(workspaceId, user.id);
    await this.attachmentRepository.remove(attachment);

    try {
      unlink(attachment.path, () => {});
    } catch {}

    return { message: 'Attachment deleted' };
  }

  async getAttachmentCount(cardId: string): Promise<number> {
    return this.attachmentRepository.count({ where: { card: { id: cardId } } });
  }

  async uploadCardCover(workspaceId: string, boardId: string, columnId: string, cardId: string, file: Express.Multer.File, user: User) {
    await this.workspaceService.checkAccess(workspaceId, user.id);

    const card = await this.cardRepository.findOne({
      where: { id: cardId, column: { id: columnId, board: { id: boardId } } },
      relations: ['column', 'column.board'],
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    card.coverPath = file.path;
    return this.cardRepository.save(card);
  }

  async deleteCardCover(workspaceId: string, boardId: string, columnId: string, cardId: string, user: User) {
    await this.workspaceService.checkAccess(workspaceId, user.id);

    const card = await this.cardRepository.findOne({
      where: { id: cardId, column: { id: columnId, board: { id: boardId } } },
      relations: ['column', 'column.board'],
    });

    if (!card || !card.coverPath) {
      throw new NotFoundException('Cover not found');
    }

    try {
      unlink(card.coverPath, () => {});
    } catch {}

    card.coverPath = undefined;
    return this.cardRepository.save(card);
  }

  async addComment(workspaceId: string, boardId: string, columnId: string, cardId: string, user: User, dto: CreateCommentDto) {
    await this.workspaceService.checkAccess(workspaceId, user.id);

    const card = await this.cardRepository.findOne({
      where: { id: cardId, column: { id: columnId, board: { id: boardId } } },
      relations: ['column', 'column.board'],
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    const comment = this.commentRepository.create({
      text: dto.text,
      author: user,
      card,
    });

    return this.commentRepository.save(comment);
  }

  async getComments(workspaceId: string, boardId: string, columnId: string, cardId: string, user: User) {
    await this.workspaceService.checkAccess(workspaceId, user.id);

    return this.commentRepository.find({
      where: { card: { id: cardId, column: { id: columnId, board: { id: boardId } } } },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });
  }

  async deleteComment(workspaceId: string, commentId: string, user: User) {
    await this.workspaceService.checkAccess(workspaceId, user.id);

    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['author'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const isAdmin = await this.workspaceService.isAdmin(workspaceId, user);
    if(!isAdmin) {
      throw new ForbiddenException('Only admin can remove members from card');
    }
    await this.commentRepository.remove(comment);

    return { message: 'Comment deleted' };
  }

  async moveAllCardsToAnotherColumn(workspaceId: string, boardId: string, sourceColumnId: string, targetColumnId: string, user: User) {
    await this.workspaceService.checkAccess(workspaceId, user.id);

    const [sourceColumn, targetColumn] = await this.columnRepository.find({
      where: [
        { id: sourceColumnId, board: { id: boardId } },
        { id: targetColumnId, board: { id: boardId } },
      ],
      relations: ['board'],
    });

    if (!sourceColumn || !targetColumn) {
      throw new NotFoundException('One or both columns not found in the board');
    }

    const cards = await this.cardRepository.find({
      where: { column: { id: sourceColumnId } },
      order: { position: 'ASC' },
    });

    for (let i = 0; i < cards.length; i++) {
      cards[i].column = targetColumn;
      cards[i].position = i;
    }
    await this.cardRepository.save(cards);

    return { message: `Moved ${cards.length} cards to target column` };
  }
}
