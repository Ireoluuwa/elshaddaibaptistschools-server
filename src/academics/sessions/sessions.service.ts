import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { AcademicYear } from '../entities/academic-year.entity';
import { Term } from '../entities/term.entity';
import { TermStatus } from '../enums/term-status.enum';
import { CreateSessionDto } from './dto/create-session.dto';
import { CreateTermDto } from './dto/create-term.dto';
import { UpdateTermDto } from './dto/update-term.dto';
import { UpdateReportDetailsDto } from './dto/update-report-details.dto';
import { EnrollmentsService } from '../../enrollments/enrollments.service';
import { assertTermOpenForAdmin } from '../term-lock';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(AcademicYear)
    private readonly yearRepository: Repository<AcademicYear>,
    @InjectRepository(Term)
    private readonly termRepository: Repository<Term>,
    private readonly dataSource: DataSource,
    private readonly enrollmentsService: EnrollmentsService,
  ) {}

  async findAll() {
    const years = await this.yearRepository.find({
      relations: ['terms'],
      order: { name: 'DESC' },
    });
    return years.map((year) => this.toSessionView(year));
  }

  async create(dto: CreateSessionDto) {
    this.assertDateRange(dto.firstTerm.startDate, dto.firstTerm.endDate);
    if (await this.yearRepository.exists({ where: { name: dto.name } })) {
      throw new ConflictException(`Session ${dto.name} already exists`);
    }

    const yearId = await this.dataSource.transaction(async (manager) => {
      const year = await manager.save(
        manager.create(AcademicYear, { name: dto.name }),
      );
      await this.insertTerm(manager, year, dto.firstTerm);
      return year.id;
    });

    return this.findSession(yearId);
  }

  async addTerm(sessionId: string, dto: CreateTermDto) {
    const year = await this.yearRepository.findOne({
      where: { id: sessionId },
      relations: ['terms'],
    });
    if (!year) throw new NotFoundException('Session not found');
    if (year.terms.some((t) => t.name === dto.name)) {
      throw new ConflictException(`${year.name} already has a ${dto.name}`);
    }
    this.assertDateRange(dto.startDate, dto.endDate);

    await this.dataSource.transaction((manager) =>
      this.insertTerm(manager, year, dto),
    );
    return this.findSession(sessionId);
  }

  async updateTerm(id: string, dto: UpdateTermDto) {
    const term = await this.findTerm(id);
    assertTermOpenForAdmin(term);
    Object.assign(term, dto);
    this.assertDateRange(term.startDate, term.endDate);
    return this.toTermView(await this.termRepository.save(term));
  }

  async activateTerm(id: string) {
    await this.findTerm(id);
    await this.dataSource.transaction((manager) =>
      this.makeActive(manager, id),
    );
    return this.toTermView(await this.findTerm(id));
  }

  async closeTerm(id: string) {
    const term = await this.findTerm(id);
    term.status = TermStatus.CLOSED;
    term.isCurrent = false;
    return this.toTermView(await this.termRepository.save(term));
  }

  // Allowed on closed terms too: release doesn't change any results.
  async setResultsReleased(id: string, released: boolean) {
    const term = await this.findTerm(id);
    if (released && term.status === TermStatus.UPCOMING) {
      throw new BadRequestException(
        "This term hasn't started yet, so there are no results to release",
      );
    }
    term.resultsReleasedAt = released ? new Date() : null;
    return this.toTermView(await this.termRepository.save(term));
  }

  async updateReportDetails(id: string, dto: UpdateReportDetailsDto) {
    const term = await this.findTerm(id);
    assertTermOpenForAdmin(term);
    // Only touch fields that were sent; null clears a field.
    for (const key of [
      'signatureUrl',
      'signedDate',
      'vacationDate',
      'resumptionDate',
    ] as const) {
      if (dto[key] !== undefined) term[key] = dto[key];
    }
    return this.toTermView(await this.termRepository.save(term));
  }

  private async insertTerm(
    manager: EntityManager,
    year: AcademicYear,
    dto: CreateTermDto,
  ) {
    const term = await manager.save(
      manager.create(Term, {
        name: dto.name,
        startDate: dto.startDate,
        endDate: dto.endDate,
        academicYear: year,
      }),
    );
    if (dto.makeActive) await this.makeActive(manager, term.id);
  }

  // Only one term (and its session) is active at a time; the previous active term is closed.
  private async makeActive(manager: EntityManager, termId: string) {
    const term = await manager.findOneOrFail(Term, {
      where: { id: termId },
      relations: ['academicYear'],
    });
    if (term.status === TermStatus.ACTIVE) return;
    const previousYear = await manager.findOne(AcademicYear, {
      where: { isCurrent: true },
    });

    await manager.update(
      Term,
      { status: TermStatus.ACTIVE },
      { status: TermStatus.CLOSED, isCurrent: false },
    );
    await manager.update(
      Term,
      { id: termId },
      { status: TermStatus.ACTIVE, isCurrent: true },
    );
    await manager.update(
      AcademicYear,
      { isCurrent: true },
      { isCurrent: false },
    );
    await manager.update(
      AcademicYear,
      { id: term.academicYear.id },
      { isCurrent: true },
    );

    if (!previousYear) {
      await this.enrollmentsService.enrollPlacedStudents(
        manager,
        term.academicYear.id,
      );
    }

    // Moving into a later session applies the promotion decisions (once).
    if (
      previousYear &&
      previousYear.id !== term.academicYear.id &&
      term.academicYear.name > previousYear.name
    ) {
      await this.enrollmentsService.rollOver(
        manager,
        previousYear.id,
        term.academicYear.id,
      );
    }
  }

  private async findSession(id: string) {
    const year = await this.yearRepository.findOneOrFail({
      where: { id },
      relations: ['terms'],
    });
    return this.toSessionView(year);
  }

  private async findTerm(id: string) {
    const term = await this.termRepository.findOne({ where: { id } });
    if (!term) throw new NotFoundException('Term not found');
    return term;
  }

  private assertDateRange(startDate: string, endDate: string) {
    if (endDate <= startDate)
      throw new BadRequestException('End date must be after the start date');
  }

  private toSessionView(year: AcademicYear) {
    return {
      id: year.id,
      name: year.name,
      isCurrent: year.isCurrent,
      terms: [...(year.terms ?? [])]
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .map((term) => this.toTermView(term)),
    };
  }

  private toTermView(term: Term) {
    const { signatureUrl, signedDate, vacationDate, resumptionDate } = term;
    const hasDetails =
      signatureUrl || signedDate || vacationDate || resumptionDate;
    return {
      id: term.id,
      name: term.name,
      startDate: term.startDate,
      endDate: term.endDate,
      status: term.status,
      resultsReleasedAt: term.resultsReleasedAt,
      reportDetails: hasDetails
        ? { signatureUrl, signedDate, vacationDate, resumptionDate }
        : null,
    };
  }
}
