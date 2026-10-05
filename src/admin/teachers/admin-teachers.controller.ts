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
import { AdminTeachersService } from './admin-teachers.service';
import { CreateStaffDto } from '../dto/create-staff.dto';
import { SetPasswordDto } from '../dto/set-password.dto';
import { UpdateStaffDto } from '../dto/update-staff.dto';
import { AssignClassDto } from './dto/assign-class.dto';

@Controller('admin/teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminTeachersController {
  constructor(private readonly adminTeachersService: AdminTeachersService) {}

  @Get()
  @ResponseMessage('Teachers retrieved successfully')
  findAll() {
    return this.adminTeachersService.findAll();
  }

  @Get(':id')
  @ResponseMessage('Teacher retrieved successfully')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminTeachersService.findOne(id);
  }

  @Patch(':id')
  @ResponseMessage('Teacher updated successfully')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStaffDto) {
    return this.adminTeachersService.update(id, dto);
  }

  @Post()
  @ResponseMessage('Teacher created successfully')
  create(@Body() dto: CreateStaffDto) {
    return this.adminTeachersService.create(dto);
  }

  @Patch(':id/class')
  @ResponseMessage('Class updated successfully')
  assignClass(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignClassDto,
  ) {
    return this.adminTeachersService.assignClass(id, dto.classId);
  }

  @Post(':id/password')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Password changed successfully')
  setPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetPasswordDto,
  ) {
    return this.adminTeachersService.setPassword(id, dto.newPassword);
  }

  @Post(':id/remove')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Teacher removed')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminTeachersService.remove(id);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Teacher restored')
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminTeachersService.restore(id);
  }

  @Delete(':id')
  @ResponseMessage('Teacher deleted permanently')
  deletePermanently(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminTeachersService.deletePermanently(id);
  }
}
