import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { User } from '../../users/entities/user.entity';

// Account actions shared by every role the admin manages.
@Injectable()
export class UserAccountsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Readable temporary password: no 0/O or 1/l/I, so it survives being read out or texted.
  generatePassword(length = 10) {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    return Array.from({ length }, () => chars[randomInt(chars.length)]).join(
      '',
    );
  }

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

  async changeUsername(
    userId: string,
    username: string,
    manager?: EntityManager,
  ) {
    const repo = (manager ?? this.userRepository.manager).getRepository(User);
    const taken = await repo.exists({ where: { username } });
    const current = await repo.findOne({ where: { id: userId } });
    if (taken && current?.username !== username) {
      throw new ConflictException(`Username ${username} is already in use`);
    }
    await repo.update(userId, { username });
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
