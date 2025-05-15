import { Body, Controller, Get, Patch, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserPurpose } from '../user/user.entity';

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
  uploadAvatar(@Body('userId') userId: string, @Body('avatarUrl') avatarUrl: string) {
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
}
