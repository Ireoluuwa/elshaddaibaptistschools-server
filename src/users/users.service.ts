import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOneByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ 
      where: { username },
      select: ['id', 'username', 'password', 'role', 'isActive'] // Explicitly select password for auth
    });
  }

  async findOneById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ 
      where: { id },
      relations: [
        'studentProfile', 
        'studentProfile.schoolClass', 
        'studentProfile.department',
        'teacherProfile', 
        'teacherProfile.schoolClass',
        'teacherProfile.department'
      ] 
    });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async update(id: string, updateData: Partial<User>): Promise<User | null> {
    await this.userRepository.update(id, updateData);
    return this.findOneById(id);
  }
}
