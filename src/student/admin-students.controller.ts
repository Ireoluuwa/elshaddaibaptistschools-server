import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { AdminStudentsService } from './admin-students.service';
import { SetPasswordDto } from './dto/set-password.dto';

@Controller('admin/students')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminStudentsController {
  constructor(private readonly adminStudentsService: AdminStudentsService) {}

  @Get()
  @ResponseMessage('Students retrieved successfully')
  findAll() {
    return this.adminStudentsService.findAll();
  }

  @Get(':id')
  @ResponseMessage('Student retrieved successfully')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminStudentsService.findOne(id);
  }

  @Post(':id/password')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Password changed successfully')
  setPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetPasswordDto,
  ) {
    return this.adminStudentsService.setPassword(id, dto.newPassword);
  }
}
