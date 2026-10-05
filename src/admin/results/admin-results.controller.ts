import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { AdminResultsService } from './admin-results.service';
import { VpRemarkDto } from './dto/vp-remark.dto';

@Controller('admin/results')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminResultsController {
  constructor(private readonly adminResultsService: AdminResultsService) {}

  @Get('overview')
  @ResponseMessage('Results overview retrieved successfully')
  overview(@Query('termId', ParseUUIDPipe) termId: string) {
    return this.adminResultsService.overview(termId);
  }

  @Get()
  @ResponseMessage('Class results retrieved successfully')
  classResults(
    @Query('termId', ParseUUIDPipe) termId: string,
    @Query('classId', ParseUUIDPipe) classId: string,
  ) {
    return this.adminResultsService.classResults(termId, classId);
  }

  @Patch(':id/vp-remark')
  @ResponseMessage('Remark saved successfully')
  setVpRemark(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VpRemarkDto,
  ) {
    return this.adminResultsService.setVpRemark(id, dto.vpRemark);
  }
}
