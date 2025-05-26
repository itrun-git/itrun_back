import { Controller, Patch, Param, Body, UseGuards, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateNameDto } from './dto/update-name.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdatePurposeDto } from './dto/update-purpose.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserDto } from './dto/user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UpdateAvatarDto } from './dto/update-avatar.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Get user name' })
  @Get('fullName')
  getFullName(@CurrentUser() user: UserDto) {
    return this.userService.findFieldById(user.id, 'fullName');
  }

  @ApiOperation({ summary: 'Update full name' })
  @Patch('update-name')
  updateName(@CurrentUser() user: UserDto, @Body() dto: UpdateNameDto) {
    return this.userService.updateName(user.id, dto.fullName);
  }

  @ApiOperation({ summary: 'Get user email' })
  @Get('email')
  getEmail(@CurrentUser() user: UserDto) {
    return this.userService.findFieldById(user.id, 'email');
  }

  @ApiOperation({ summary: 'Update email address' })
  @Patch('update-email')
  updateEmail(@CurrentUser() user: UserDto, @Body() dto: UpdateEmailDto) {
    return this.userService.updateEmail(user.id, dto.newEmail);
  }

  @ApiOperation({ summary: 'Update password' })
  @Patch('update-password')
  updatePassword(@CurrentUser() user: UserDto, @Body() dto: UpdatePasswordDto) {
    return this.userService.updatePassword(user.id, dto.oldPassword, dto.newPassword);
  }

  @ApiOperation({ summary: 'Get user avatar URL' })
  @Get('avatar')
  getAvatar(@CurrentUser() user: UserDto) {
    return this.userService.findFieldById(user.id, 'avatarUrl');
  }

  @ApiOperation({ summary: 'Update avatar URL' })
  @Patch('update-avatar')
  updateAvatar(@CurrentUser() user: UserDto, @Body() dto: UpdateAvatarDto) {
    return this.userService.updateAvatar(user.id, dto.avatarUrl);
  }

  @ApiOperation({ summary: 'Get user purpose' })
  @Get('purpose')
  getPurpose(@CurrentUser() user: UserDto) {
    return this.userService.findFieldById(user.id, 'purpose');
  }

  @ApiOperation({ summary: 'Update user purpose' })
  @Patch('update-purpose')
  updatePurpose(@CurrentUser() user: UserDto, @Body() dto: UpdatePurposeDto) {
    return this.userService.updatePurpose(user.id, dto.purpose);
  }
} 
