import { Controller, Post, Body, UnauthorizedException, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  @ResponseMessage('Login successful')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.username,
      loginDto.password,
    );
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ResponseMessage('Profile fetched successfully')
  async getProfile(@Request() req) {

    const user = await this.usersService.findOneById(req.user.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
   
    const { password, ...result } = user;


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
      schoolClass: schoolClass || null, // Concatenated: e.g. "SS1 (Science)"
    };
  }
}
