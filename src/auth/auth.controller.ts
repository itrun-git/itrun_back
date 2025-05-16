import { BadRequestException, Body, Controller, Get, Patch, Post, Query, UploadedFile, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserPurpose } from '../user/user.entity';
import { LoginDto } from './dto/login.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('check-email')
  checkEmail(@Body('email') email: string) {
    return this.authService.checkEmail(email);
  }

  @Post('register')
  register(@Body() dto: CreateUserDto) {
    return this.authService.createUser(dto);
  }

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

  @Patch('set-purpose')
  setPurpose(@Body('userId') userId: string, @Body('purpose') purpose: UserPurpose) {
    return this.authService.setPurpose(userId, purpose);
  }

  @Patch('send-verification')
  sendVerification(@Body('userId') userId: string) {
    return this.authService.sendVerificationEmail(userId);
  }

  @Get('verify')
  verifyEmail(@Query('token') token: string) {
    return this.authService.confirmEmail(token);
  }

  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Post('resend-verification')
  async resendEmail(@Body('email') email: string) {
    return this.authService.resendVerificationEmail(email);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
