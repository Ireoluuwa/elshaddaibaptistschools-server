import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { AdminBursarsService } from './admin-bursars.service';
import { CreateStaffDto } from '../dto/create-staff.dto';
import { SetPasswordDto } from '../dto/set-password.dto';

@Controller('admin/bursars')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminBursarsController {
  constructor(private readonly adminBursarsService: AdminBursarsService) {}

  @Get()
  @ResponseMessage('Bursars retrieved successfully')
  findAll() {
    return this.adminBursarsService.findAll();
  }

  @Post()
  @ResponseMessage('Bursar invited successfully')
  invite(@Body() dto: CreateStaffDto) {
    return this.adminBursarsService.invite(dto);
  }

  @Post(':id/password')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Password changed successfully')
  setPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetPasswordDto,
  ) {
    return this.adminBursarsService.setPassword(id, dto.newPassword);
  }

  @Post(':id/remove')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Bursar removed')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminBursarsService.setActive(id, false);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Bursar restored')
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminBursarsService.setActive(id, true);
  }

  @Delete(':id')
  @ResponseMessage('Bursar deleted permanently')
  deletePermanently(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminBursarsService.deletePermanently(id);
  }
}
