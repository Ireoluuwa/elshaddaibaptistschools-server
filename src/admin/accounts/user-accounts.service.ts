import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';

// Account actions shared by every role the admin manages.
@Injectable()
export class UserAccountsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }

  async setPassword(userId: string, newPassword: string) {
    const user = await this.findUser(userId);
    await this.userRepository.update(user.id, {
      password: await this.hashPassword(newPassword),
    });
    return { username: user.username };
  }

  async setActive(userId: string, isActive: boolean, manager?: EntityManager) {
    await (manager ?? this.userRepository.manager).update(
      User,
      { id: userId },
      { isActive },
    );
  }

  async usernameTaken(username: string) {
    return this.userRepository.exists({ where: { username } });
  }

  private async findUser(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
