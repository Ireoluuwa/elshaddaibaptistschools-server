import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { AdminStudentsService } from './admin-students.service';
import { SetPasswordDto } from '../dto/set-password.dto';
import { ChangeClassDto } from './dto/change-class.dto';

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

  @Patch(':id/class')
  @ResponseMessage('Class changed successfully')
  changeClass(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeClassDto,
  ) {
    return this.adminStudentsService.changeClass(id, dto);
  }

  @Post(':id/remove')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Student removed')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminStudentsService.remove(id);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Student restored')
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminStudentsService.restore(id);
  }

  @Delete(':id')
  @ResponseMessage('Student deleted permanently')
  deletePermanently(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminStudentsService.deletePermanently(id);
  }
}
