import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByUsername(username);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { 
      username: user.username, 
      sub: user.id,
      role: user.role 
    };
    return {
      user: {
        username: user.username,
        role: user.role,
      },
      access_token: this.jwtService.sign(payload),
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    let className = '';
    let deptName = '';

    if (user.studentProfile) {
      className = user.studentProfile.schoolClass?.name || '';
      deptName = user.studentProfile.department?.name || '';
    } else if (user.teacherProfile) {
      className = user.teacherProfile.schoolClass?.name || '';
      deptName = user.teacherProfile.department?.name || '';
    }

    const schoolClass = deptName ? `${className} (${deptName})`.trim() : className;

    return {
      id: user.id,
      username: user.username,
      role: user.role,
      firstName: user.studentProfile?.firstName || user.teacherProfile?.firstName || '',
      class: className || null,
      department: deptName || null,
      schoolClass: schoolClass || null,
    };
  }
}
