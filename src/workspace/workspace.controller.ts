import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Get,
  Patch,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { UserDto } from 'src/user/dto/user.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceNameDto } from './dto/update-workspace-name.dto';
import { UpdateWorkspaceVisibilityDto } from './dto/update-workspace-visibility.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { WorkspaceMemberDto } from './dto/workspace-member.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { User } from 'src/user/user.entity';
import { Workspace } from './entities/workspace.entity';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new workspace' })
  create(@Body() dto: CreateWorkspaceDto, @CurrentUser() user: UserDto) {
    return this.workspaceService.createWorkspace(dto, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workspace by id' })
  @ApiResponse({ type: [Workspace] })
  getById(@Param('id') id: string) {
    return this.workspaceService.getById(id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get all members of workspace' })
  @ApiResponse({ type: [WorkspaceMemberDto] })
  getMembers(@Param('id') id: string) {
    return this.workspaceService.getMembers(id);
  }

  @Patch(':id/name')
  @ApiOperation({ summary: 'Update workspace name' })
  updateName(
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceNameDto,
    @CurrentUser() user: User,
  ) {
    return this.workspaceService.updateName(id, user.id, dto.name);
  }

  @Patch(':id/image')
  @ApiOperation({ summary: 'Upload or update workspace background image' })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/workspace-backgrounds',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  async uploadWorkspaceImage(
    @Param('id') workspaceId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    if (!file) throw new BadRequestException('Файл не загружен');
    const imageUrl = `/uploads/workspace-backgrounds/${file.filename}`;
    return this.workspaceService.updateImage(workspaceId, user.id, imageUrl);
  }

  @Patch(':id/visibility')
  @ApiOperation({ summary: 'Update workspace visibility' })
  updateVisibility(
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceVisibilityDto,
    @CurrentUser() user: User,
  ) {
    return this.workspaceService.updateVisibility(id, user.id, dto.visibility);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete workspace (admin only)' })
  delete(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.workspaceService.deleteWorkspace(id, user.id);
  }

  @Get(':id/invite-link')
  @ApiOperation({ summary: 'Generate invite link (admin only)' })
  async generateInviteLink(
    @Param('id') workspaceId: string,
    @CurrentUser() user: User,
  ) {
    return this.workspaceService.generateInviteLink(workspaceId, user.id);
  }

  @Post('join')
  @ApiOperation({ summary: 'Join a workspace using invite token' })
  async joinWorkspaceWithToken(
    @Body('token') token: string,
    @CurrentUser() user: User,
  ) {
    return this.workspaceService.joinWithInviteToken(token, user.id);
  }

  @Delete(':workspaceId/members/:userId')
  @ApiOperation({ summary: 'Remove member from workspace (admin only)' })
  async removeMember(
    @Param('workspaceId') workspaceId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.workspaceService.removeMember(workspaceId, user, userId);
  }

  @Delete(':workspaceId/leave')
  @ApiOperation({ summary: 'Leave workspace (for members)' })
  async leaveWorkspace(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    return this.workspaceService.leaveWorkspace(workspaceId, user);
  }

  @Get('own')
  @ApiOperation({ summary: 'Get workspaces where user is admin' })
  @ApiResponse({
    status: 200,
    description: 'List of owned workspaces',
    type: [Workspace],
  })
  async getOwn(@CurrentUser() user: User): Promise<Workspace[]> {
    return this.workspaceService.getOwnWorkspaces(user);
  }

  @Get('guest')
  @ApiOperation({ summary: 'Get workspaces where user is guest (member)' })
  @ApiResponse({
    status: 200,
    description: 'List of guest workspaces',
    type: [Workspace],
  })
  async getGuest(@CurrentUser() user: User): Promise<Workspace[]> {
    return this.workspaceService.getGuestWorkspaces(user);
  }
}
