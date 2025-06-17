import { BadRequestException, Body, Controller, Get, Patch, Post, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiOperation, ApiBody, ApiConsumes, ApiBearerAuth, ApiTags, ApiResponse } from '@nestjs/swagger';
import { EmailCheckDto } from './dto/email-check.dto';
import { SetPurposeDto } from './dto/set-purpose.dto';
import { ChangeRegistrationEmailDto } from './dto/change-email.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Check if email is already in use' })
  @Post('check-email')
  checkEmail(@Body() dto: EmailCheckDto) {
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

  @ApiOperation({ summary: 'Change user email on registration page' })
  @Patch('change-email')
  changeEmail(@Body() dto: ChangeRegistrationEmailDto) {
    return this.authService.changeRegistrationEmail(dto);
  }

  @ApiTags('OAuth2')
  @ApiOperation({ summary: 'Redirect user to Google for authentication' })
  @ApiResponse({ status: 302, description: 'Redirects user to Google OAuth page' })
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {}

  @ApiTags('OAuth2')
  @ApiOperation({ summary: 'Google OAuth2 callback' })
  @ApiResponse({ status: 302, description: 'Redirects user to frontend with JWT' })
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req, @Res() res) {
    if (!req.user) {
      throw new BadRequestException('Authentication failed');
    }
    const payload = { sub: req.user.id, email: req.user.email };
    const token = await this.authService['jwtService'].signAsync(payload);

    const frontendUrl = this.authService['configService'].get('FRONTEND_URL');
    return res.redirect(`${frontendUrl}/auth/social-login?token=${token}`);
  }

}
