import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { AdminStudentsService } from './admin-students.service';

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
}
