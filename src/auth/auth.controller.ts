import { BadRequestException, Body, Controller, Get, Patch, Post, Query, UploadedFile, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserPurpose } from '../user/user.entity';
import { LoginDto } from './dto/login.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiOperation, ApiBody, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { EmailCheckDto } from './dto/email-check.dto';
import { SetPurposeDto } from './dto/set-purpose.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Check if email is already in use' })
  @Post('check-email')
  checkEmail(@Body('email') dto: EmailCheckDto) {
    return this.authService.checkEmail(dto);
  }

  @ApiOperation({ summary: 'Register new user' })
  @Post('register')
  register(@Body() dto: CreateUserDto) {
    return this.authService.createUser(dto);
  }

  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: 'user-uuid' },
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Patch('upload-avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Body('userId') userId: string) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    return this.authService.uploadAvatar(userId, avatarUrl);
  }

  @ApiOperation({ summary: 'Set user purpose' })
  @ApiBearerAuth()
  @Patch('set-purpose')
  setPurpose(@Body() dto: SetPurposeDto) {
    return this.authService.setPurpose(dto.userId, dto.purpose);
  }

  @ApiOperation({ summary: 'Send initial verification email' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: 'user-uuid' },
      },
    },
  })
  @Patch('send-verification')
  sendVerification(@Body('userId') userId: string) {
    return this.authService.sendVerificationEmail(userId);
  }

  @ApiOperation({ summary: 'Verify email address' })
  @Get('verify')
  verifyEmail(@Query('token') token: string) {
    return this.authService.confirmEmail(token);
  }

  @ApiOperation({ summary: 'Send verification email again' })
  @Post('resend-verification')
  async resendEmail(@Body('email') email: string) {
    return this.authService.resendVerificationEmail(email);
  }

  @ApiOperation({ summary: 'User login' })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
