import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { AdminPromotionsService } from './admin-promotions.service';
import { SavePromotionsDto } from './dto/save-promotions.dto';

@Controller('admin/promotions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminPromotionsController {
  constructor(
    private readonly adminPromotionsService: AdminPromotionsService,
  ) {}

  @Get()
  @ResponseMessage('Promotion progress retrieved successfully')
  summary() {
    return this.adminPromotionsService.summary();
  }

  @Get(':classId')
  @ResponseMessage('Class promotion retrieved successfully')
  forClass(@Param('classId', ParseUUIDPipe) classId: string) {
    return this.adminPromotionsService.forClass(classId);
  }

  @Put(':classId')
  @ResponseMessage('Promotion saved successfully')
  save(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Body() dto: SavePromotionsDto,
  ) {
    return this.adminPromotionsService.save(classId, dto);
  }

  @Delete(':classId')
  @ResponseMessage('Promotion undone')
  undo(@Param('classId', ParseUUIDPipe) classId: string) {
    return this.adminPromotionsService.undo(classId);
  }
}
