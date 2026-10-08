import {
  Body,
  Controller,
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
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { CreateTermDto } from './dto/create-term.dto';
import { UpdateTermDto } from './dto/update-term.dto';
import { UpdateReportDetailsDto } from './dto/update-report-details.dto';

@Controller('academics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get('sessions')
  @ResponseMessage('Sessions retrieved successfully')
  findAll() {
    return this.sessionsService.findAll();
  }

  @Post('sessions')
  @ResponseMessage('Session created successfully')
  create(@Body() dto: CreateSessionDto) {
    return this.sessionsService.create(dto);
  }

  @Post('sessions/:id/terms')
  @ResponseMessage('Term added successfully')
  addTerm(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateTermDto) {
    return this.sessionsService.addTerm(id, dto);
  }

  @Patch('terms/:id')
  @ResponseMessage('Term updated successfully')
  updateTerm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTermDto,
  ) {
    return this.sessionsService.updateTerm(id, dto);
  }

  @Post('terms/:id/activate')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Term activated successfully')
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.sessionsService.activateTerm(id);
  }

  @Post('terms/:id/close')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Term closed successfully')
  close(@Param('id', ParseUUIDPipe) id: string) {
    return this.sessionsService.closeTerm(id);
  }

  @Post('terms/:id/release-results')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Results released to students')
  releaseResults(@Param('id', ParseUUIDPipe) id: string) {
    return this.sessionsService.setResultsReleased(id, true);
  }

  @Post('terms/:id/hide-results')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Results hidden from students')
  hideResults(@Param('id', ParseUUIDPipe) id: string) {
    return this.sessionsService.setResultsReleased(id, false);
  }

  @Patch('terms/:id/report-details')
  @ResponseMessage('Report sheet details saved successfully')
  updateReportDetails(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReportDetailsDto,
  ) {
    return this.sessionsService.updateReportDetails(id, dto);
  }
}
