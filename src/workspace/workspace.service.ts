import { Injectable, NotFoundException, ForbiddenException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { Workspace, WorkspaceVisibility } from './entities/workspace.entity';
import { WorkspaceMember, WorkspaceMemberRole,} from './entities/workspace-member.entity';
import { WorkspaceMemberDto } from './dto/workspace-member.dto';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { InvitePayload } from './interfaces/invitePayload.interface';
import { User } from 'src/user/user.entity';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(Workspace) 
    private workspaceRepository: Repository<Workspace>,

    @InjectRepository(WorkspaceMember) 
    private memberRepository: Repository<WorkspaceMember>,

    private readonly configService: ConfigService,
  ) {}

  async getWorkspaceById(id: string): Promise<Workspace> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id }
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async createWorkspace(dto: CreateWorkspaceDto, userId: string): Promise<Workspace> {
    const workspace = this.workspaceRepository.create(dto);
    await this.workspaceRepository.save(workspace);

    const member = this.memberRepository.create({
      user: { id: userId },
      workspace,
      role: WorkspaceMemberRole.ADMIN,
    });
    await this.memberRepository.save(member);

    return workspace;
  }

  async getById(id: string) {
    return await this.workspaceRepository.findOneBy({ id });
  }

  async getMembers(workspaceId: string): Promise<WorkspaceMemberDto[]> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const members = await this.memberRepository
      .createQueryBuilder('member')
      .innerJoin('member.user', 'user')
      .where('member.workspace.id = :workspaceId', { workspaceId })
      .select([
        'user.id AS id',
        'user.fullName AS fullName',
        'user.email AS email',
        'user.avatarUrl AS avatarUrl',
      ])
      .getRawMany();

    return members.map((raw) => ({
      id: raw.id,
      fullName: raw.fullName,
      email: raw.email,
      avatarUrl: raw.avatarUrl,
    }));
  }

  async updateName(workspaceId: string, userId: string, name: string) {
    const member = await this.memberRepository.findOne({
      where: {
        workspace: { id: workspaceId },
        user: { id: userId },
      },
      relations: ['workspace'],
    });

    if (!member)
      throw new NotFoundException('You are not a member of this workspace!');
    if (member.role !== WorkspaceMemberRole.ADMIN)
      throw new ForbiddenException('Нет доступа');

    member.workspace.name = name;
    return this.workspaceRepository.save(member.workspace);
  }

  async updateImage(workspaceId: string, userId: string, imageUrl: string) {
    const member = await this.memberRepository.findOne({
      where: {
        workspace: { id: workspaceId },
        user: { id: userId },
      },
      relations: ['workspace', 'user'],
    });

    if (!member || member.role !== WorkspaceMemberRole.ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    await this.workspaceRepository.update(workspaceId, { imageUrl });
    return { success: true, imageUrl };
  }

  async updateVisibility(
    workspaceId: string,
    userId: string,
    visibility: WorkspaceVisibility,
  ) {
    const member = await this.memberRepository.findOne({
      where: {
        workspace: { id: workspaceId },
        user: { id: userId },
      },
      relations: ['workspace'],
    });

    if (!member)
      throw new NotFoundException('You are not a member of this workspace!');
    if (member.role !== WorkspaceMemberRole.ADMIN)
      throw new ForbiddenException('Access denied');

    member.workspace.visibility = visibility;
    return this.workspaceRepository.save(member.workspace);
  }

  async deleteWorkspace(id: string, userId: string) {
    const member = await this.memberRepository.findOne({
      where: {
        workspace: { id },
        user: { id: userId },
      },
      relations: ['workspace'],
    });

    if (!member) throw new NotFoundException('Membership not found');
    if (member.role !== WorkspaceMemberRole.ADMIN)
      throw new ForbiddenException('Only admin can delete');

    await this.workspaceRepository.remove(member.workspace);
  }

  async generateInviteLink(workspaceId: string, userId: string) {
    const member = await this.memberRepository.findOne({
      where: { workspace: { id: workspaceId }, user: { id: userId } },
      relations: ['workspace', 'user'],
    });

    if (!member || member.role !== WorkspaceMemberRole.ADMIN) {
      throw new ForbiddenException('Only an admin can create an invite link');
    }

    const secret = this.configService.get<string>('INVITE_SECRET');
    if (!secret) throw new Error('INVITE_SECRET is not defined');

    const token = jwt.sign({ workspaceId }, secret, { expiresIn: '1d' });
    const inviteLink = `${process.env.FRONTEND_URL}/invite?token=${token}`;
    return { inviteLink };
  }

  async joinWithInviteToken(token: string, userId: string) {
    const secret = this.configService.get<string>('INVITE_SECRET');
    if (!secret) throw new Error('INVITE_SECRET is not defined');

    let payload: InvitePayload;
    try {
      payload = jwt.verify(token, secret) as InvitePayload;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const workspace = await this.workspaceRepository.findOne({
      where: { id: payload.workspaceId },
    });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const alreadyMember = await this.memberRepository.findOne({
      where: { workspace: { id: payload.workspaceId }, user: { id: userId } },
      relations: ['workspace', 'user'],
    });

    if (alreadyMember) {
      return { message: 'You are already a member of this workspace' };
    }

    const member = this.memberRepository.create({
      workspace,
      user: { id: userId },
      role: WorkspaceMemberRole.MEMBER,
    });

    await this.memberRepository.save(member);

    return {
      message: 'Successfully joined the workspace',
      workspaceId: workspace.id,
    };
  }

  async removeMember(
    workspaceId: string,
    user: User,
    targetUserId: string,
  ): Promise<void> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
      relations: ['members', 'members.user'],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const currentMember = workspace.members.find(
      (member) => member.user.id === user.id,
    );

    if (!currentMember || currentMember.role !== WorkspaceMemberRole.ADMIN) {
      throw new ForbiddenException('Only admin can remove members');
    }

    if (user.id === targetUserId) {
      throw new BadRequestException('You cannot remove yourself');
    }

    const targetMember = workspace.members.find(
      (member) => member.user.id === targetUserId,
    );

    if (!targetMember) {
      throw new NotFoundException('Target member not found in workspace');
    }

    if (targetMember.role === WorkspaceMemberRole.ADMIN) {
      throw new ForbiddenException('Cannot remove another admin');
    }

    await this.memberRepository.delete({
      workspace: { id: workspaceId },
      user: { id: targetUserId },
    });
  }

  async leaveWorkspace(
    workspaceId: string,
    user: User,
  ): Promise<{ message: string }> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
      relations: ['members', 'members.user'],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const member = workspace.members.find((m) => m.user.id === user.id);
    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const isAdmin = member.role === WorkspaceMemberRole.ADMIN;
    const otherAdmins = workspace.members.filter(
      (m) => m.role === WorkspaceMemberRole.ADMIN && m.user.id !== user.id,
    );

    if (isAdmin && otherAdmins.length === 0) {
      throw new BadRequestException(
        'Owner cannot leave workspace without assigning another admin',
      );
    }
    await this.memberRepository.delete({ id: member.id });

    return { message: 'Successfully left the workspace' };
  }

  async getOwnWorkspaces(user: User): Promise<Workspace[]> {
    return this.workspaceRepository
      .createQueryBuilder('workspace')
      .leftJoin('workspace.members', 'member')
      .leftJoinAndSelect('workspace.members', 'members')
      .where('member.userId = :userId', { userId: user.id })
      .andWhere('member.role = :role', { role: 'admin' })
      .orderBy('workspace.created_at', 'DESC')
      .getMany();
  }

  async getGuestWorkspaces(user: User): Promise<Workspace[]> {
    return this.workspaceRepository
      .createQueryBuilder('workspace')
      .leftJoin('workspace.members', 'member')
      .leftJoinAndSelect('workspace.members', 'members')
      .where('member.userId = :userId', { userId: user.id })
      .andWhere('member.role = :role', { role: 'member' })
      .orderBy('workspace.created_at', 'DESC')
      .getMany();
  }

  async checkAccess(workspaceId: string, userId: string) {
    const member = await this.memberRepository.findOne({
      where: { workspace: { id: workspaceId }, user: { id: userId } },
    });

    if (!member) {
      throw new ForbiddenException('Access denied: you are not a member of this workspace');
    }
  }

  async isAdmin(workspaceId: string, user: User): Promise<boolean> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
      relations: ['members', 'members.user'],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace.members.some(
      (member) => member.user.id === user.id && member.role === WorkspaceMemberRole.ADMIN,
    );
  }

}
