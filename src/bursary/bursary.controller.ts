import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { BursaryService } from './bursary.service';
import { SaveBillDto } from './dto/save-bill.dto';
import { SaveFeesDto } from './dto/save-fees.dto';

// termId is optional on reads: it defaults to the active term.
@Controller('bursary')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.BURSAR, UserRole.ADMIN)
export class BursaryController {
  constructor(private readonly bursaryService: BursaryService) {}

  @Get('terms')
  @ResponseMessage('Terms retrieved successfully')
  terms() {
    return this.bursaryService.terms();
  }

  @Get('overview')
  @ResponseMessage('Overview retrieved successfully')
  overview(
    @Query('termId', new ParseUUIDPipe({ optional: true })) termId?: string,
  ) {
    return this.bursaryService.overview(termId);
  }

  @Get('bills')
  @ResponseMessage('Bills retrieved successfully')
  bills(
    @Query('termId', new ParseUUIDPipe({ optional: true })) termId?: string,
  ) {
    return this.bursaryService.bills(termId);
  }

  @Put('bills/:classId')
  @ResponseMessage('Bill saved successfully')
  saveBill(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Query('termId', ParseUUIDPipe) termId: string,
    @Body() dto: SaveBillDto,
  ) {
    return this.bursaryService.saveBill(termId, classId, dto);
  }

  @Get('fees')
  @ResponseMessage('Fees retrieved successfully')
  fees(
    @Query('classId', ParseUUIDPipe) classId: string,
    @Query('termId', new ParseUUIDPipe({ optional: true })) termId?: string,
  ) {
    return this.bursaryService.fees(termId, classId);
  }

  @Put('fees')
  @ResponseMessage('Fees saved successfully')
  saveFees(
    @Query('termId', ParseUUIDPipe) termId: string,
    @Body() dto: SaveFeesDto,
  ) {
    return this.bursaryService.saveFees(termId, dto);
  }
}
