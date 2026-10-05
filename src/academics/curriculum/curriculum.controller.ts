import { Body, Controller, Get, Param, ParseUUIDPipe, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CurriculumService } from './curriculum.service';
import { UpdateCurriculumDto } from './dto/update-curriculum.dto';

@Controller('academics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  @Get('subjects/catalog')
  @ResponseMessage('Subjects retrieved successfully')
  getCatalog() {
    return this.curriculumService.getSubjectCatalog();
  }

  @Get('curriculum/:classId')
  @ResponseMessage('Curriculum retrieved successfully')
  getForClass(@Param('classId', ParseUUIDPipe) classId: string) {
    return this.curriculumService.getForClass(classId);
  }

  @Put('curriculum/:classId')
  @ResponseMessage('Curriculum saved successfully')
  replaceForClass(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Body() dto: UpdateCurriculumDto,
  ) {
    return this.curriculumService.replaceForClass(classId, dto);
  }
}
