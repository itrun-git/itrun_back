import { BadRequestException, ConflictException, Injectable, NotFoundException, Logger} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserPurpose } from '../user/user.entity';
import * as bcrypt from 'bcryptjs';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { EmailCheckDto } from './dto/email-check.dto';
import { ChangeRegistrationEmailDto } from './dto/change-email.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async checkEmail(dto: EmailCheckDto): Promise<{ available: boolean }> {
    const exists = await this.userRepository.findOne({ where: { email: dto.email } });
    return { available: !exists };
  }

  async createUser(dto: CreateUserDto): Promise<User> {
    const exists = await this.userRepository.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const verificationToken = this.generateVerificationToken();

    const user = this.userRepository.create({
      email: dto.email,
      fullName: dto.name,
      passwordHash,
      emailVerified: false,
      isActive: false,
      verificationToken,
      purpose: UserPurpose.PERSONAL, // default, обновится позже
    });

    return await this.userRepository.save(user);
  }

  async uploadAvatar(userId: string, avatarUrl: string): Promise<User> {
    const user = await this.findUserByIdOrFail(userId);
    user.avatarUrl = avatarUrl;
    return await this.userRepository.save(user);
  }

  async setPurpose(userId: string, purpose: UserPurpose): Promise<User> {
    const user = await this.findUserByIdOrFail(userId);
    user.purpose = purpose;
    return await this.userRepository.save(user);
  }

  async sendVerificationEmail(userId: string): Promise<void> {
    const user = await this.findUserByIdOrFail(userId);
    if (user.emailVerified) throw new BadRequestException('Email already verified');

    const token = user.verificationToken || this.generateVerificationToken();
    user.verificationToken = token;
    await this.userRepository.save(user);

    const url = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${token}`;

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Please confirm your email',
      template: './verify',
      context: {
        name: user.fullName,
        url,
      },
    });
  }

  async confirmEmail(token: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { verificationToken: token } });
    if (!user) throw new NotFoundException('Invalid or expired token');

    user.emailVerified = true;
    user.isActive = true;
    user.verificationToken = undefined;

    await this.userRepository.save(user);
  }

  private generateVerificationToken(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }

  private async findUserByIdOrFail(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    user.verificationToken = this.generateVerificationToken();
    await this.userRepository.save(user);

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Confirm your email (resend)',
      template: 'verify',
      context: {
        name: user.fullName,
        url: `${this.configService.get('FRONTEND_URL')}/auth/verify?token=${user.verificationToken}`,
      },
    });

    this.logger.log(`Verification email resent to: ${user.email}`);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new BadRequestException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid email or password');
    }

    if (!user.emailVerified) {
      throw new BadRequestException('Please confirm your email before logging in');
    }

    const payload = { sub: user.id, email: user.email };
    const token = await this.jwtService.signAsync(payload);

    return {
      message: 'Login successful',
      token,
    };
  }

  async changeRegistrationEmail(dto: ChangeRegistrationEmailDto): Promise<{ available: boolean }> {
    const { currentEmail, newEmail } = dto;

    const emailTaken = await this.userRepository.findOne({ where: { email: newEmail } });
    if (emailTaken) {
      throw new ConflictException('New email already in use');
    }

    const user = await this.userRepository.findOne({ where: { email: currentEmail } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.email = newEmail;
    await this.userRepository.save(user);

    return { available: true };
  }

  async findOrCreateGoogleUser(profile: { email: string, googleId: string, fullName: string, avatarUrl?: string }): Promise<User> {
    let user = await this.userRepository.findOne({
      where: [
        { googleId: profile.googleId },
        { email: profile.email },
      ]
    });

    if (user) {
      if (!user.googleId) {
        user.googleId = profile.googleId;
        user.avatarUrl = profile.avatarUrl;
        user.emailVerified = true;
        user.isActive = true;
        await this.userRepository.save(user);
      }
      return user;
    }
    user = this.userRepository.create({
      email: profile.email,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
      googleId: profile.googleId,
      passwordHash: '',
      emailVerified: true,
      isActive: true,
      purpose: UserPurpose.PERSONAL,
    });
    return await this.userRepository.save(user);
  }
  
}
