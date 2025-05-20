import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserPurpose } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) {}

  async updateName(userId: string, fullName: string) {
    await this.userRepository.update(userId, { fullName });
    return { message: 'Full name updated' };
  }

  async updateEmail(userId: string, email: string) {
    await this.userRepository.update(userId, { email });
    return { message: 'Email updated' };
  }

  async updatePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new Error('User not found');

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) throw new Error('Old password is incorrect');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(userId, { passwordHash: hashed });

    return { message: 'Password updated' };
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    await this.userRepository.update(userId, { avatarUrl });
    return { message: 'Avatar updated' };
  }

  async updatePurpose(userId: string, purpose: UserPurpose) {
  await this.userRepository.update(userId, { purpose });
  return { message: 'Purpose updated' };
}
}
