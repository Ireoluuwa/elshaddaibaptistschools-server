import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { ClassBill } from './entities/class-bill.entity';
import { StudentFee } from './entities/student-fee.entity';
import { Term } from '../academics/entities/term.entity';
import { SchoolClass } from '../academics/entities/school-class.entity';
import { AcademicYear } from '../academics/entities/academic-year.entity';
import { TermStatus } from '../academics/enums/term-status.enum';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { SaveBillDto } from './dto/save-bill.dto';
import { SaveFeesDto } from './dto/save-fees.dto';

const billTotal = (b: Pick<ClassBill, 'tuition' | 'ict' | 'otherCharges'>) =>
  b.tuition + b.ict + b.otherCharges.reduce((sum, c) => sum + c.amount, 0);

@Injectable()
export class BursaryService {
  constructor(
    @InjectRepository(ClassBill)
    private readonly billRepository: Repository<ClassBill>,
    @InjectRepository(StudentFee)
    private readonly feeRepository: Repository<StudentFee>,
    @InjectRepository(Term)
    private readonly termRepository: Repository<Term>,
    @InjectRepository(SchoolClass)
    private readonly classRepository: Repository<SchoolClass>,
    @InjectRepository(AcademicYear)
    private readonly yearRepository: Repository<AcademicYear>,
    private readonly enrollmentsService: EnrollmentsService,
    private readonly dataSource: DataSource,
  ) {}

  // Every term, newest session first, for the bursar's term picker.
  async terms() {
    const years = await this.yearRepository.find({
      relations: ['terms'],
      order: { name: 'DESC' },
    });
    return years.flatMap((y) =>
      [...y.terms]
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .map((t) => ({
          id: t.id,
          label: `${y.name} · ${t.name}`,
          status: t.status,
        })),
    );
  }

  async overview(termId?: string) {
    const term = await this.resolveTerm(termId);
    const [classes, roster] = await Promise.all([
      this.classRepository.find({ order: { name: 'ASC' } }),
      this.enrollmentsService.rosterFor(term.academicYear.id),
    ]);
    const owed = await this.outstandingMap(
      term.id,
      roster.map((e) => e.student.id),
    );

    const rows = classes.map((c) => {
      const students = roster.filter((e) => e.schoolClass.id === c.id);
      const balances = students.map((e) => owed.get(e.student.id) ?? 0);
      return {
        classId: c.id,
        className: c.name,
        students: students.length,
        owing: balances.filter((b) => b > 0).length,
        outstanding: balances.reduce((a, b) => a + b, 0),
      };
    });

    return {
      term: this.termView(term),
      outstanding: rows.reduce((a, r) => a + r.outstanding, 0),
      owing: rows.reduce((a, r) => a + r.owing, 0),
      classes: rows,
    };
  }

  async bills(termId?: string) {
    const term = await this.resolveTerm(termId);
    const [classes, bills] = await Promise.all([
      this.classRepository.find({ order: { name: 'ASC' } }),
      this.billRepository.find({
        where: { term: { id: term.id } },
        relations: ['schoolClass'],
      }),
    ]);
    return {
      term: this.termView(term),
      classes: classes.map((c) => {
        const bill = bills.find((b) => b.schoolClass.id === c.id);
        return {
          classId: c.id,
          className: c.name,
          isSenior: c.isSenior,
          saved: !!bill,
          tuition: bill?.tuition ?? 0,
          ict: bill?.ict ?? 0,
          otherCharges: bill?.otherCharges ?? [],
          total: bill ? billTotal(bill) : 0,
        };
      }),
    };
  }

  // A closed term's report sheets are final, so its bill can't change.
  async saveBill(termId: string, classId: string, dto: SaveBillDto) {
    const term = await this.resolveTerm(termId);
    if (term.status === TermStatus.CLOSED) {
      throw new ForbiddenException(
        'This term is closed. Ask the admin to reopen it to change its bill.',
      );
    }
    const schoolClass = await this.classRepository.findOne({
      where: { id: classId },
    });
    if (!schoolClass) throw new NotFoundException('Class not found');

    const existing = await this.billRepository.findOne({
      where: { term: { id: term.id }, schoolClass: { id: classId } },
    });
    await this.billRepository.save(
      this.billRepository.create({
        id: existing?.id,
        term,
        schoolClass,
        tuition: dto.tuition,
        ict: dto.ict,
        otherCharges: dto.otherCharges.map((c) => ({
          name: c.name.trim(),
          amount: c.amount,
        })),
      }),
    );
    return this.bills(term.id);
  }

  // Students in a class that term, with what they owe.
  async fees(termId: string | undefined, classId: string) {
    const term = await this.resolveTerm(termId);
    const roster = await this.enrollmentsService.rosterFor(
      term.academicYear.id,
      classId,
    );
    const owed = await this.outstandingMap(
      term.id,
      roster.map((e) => e.student.id),
    );
    return {
      term: this.termView(term),
      students: roster.map((e) => ({
        studentId: e.student.id,
        username: e.student.user.username,
        firstName: e.student.firstName,
        lastName: e.student.lastName,
        department: e.department?.name ?? null,
        outstanding: owed.get(e.student.id) ?? 0,
      })),
    };
  }

  // Balances stay editable after a term closes: payments keep coming in.
  async saveFees(termId: string, dto: SaveFeesDto) {
    const term = await this.resolveTerm(termId);
    const roster = await this.enrollmentsService.rosterFor(
      term.academicYear.id,
    );
    const inTerm = new Set(roster.map((e) => e.student.id));
    if (dto.fees.some((f) => !inTerm.has(f.studentId))) {
      throw new BadRequestException(
        'A student in the list was not enrolled that term',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      const existing = await manager.find(StudentFee, {
        where: {
          term: { id: term.id },
          student: { id: In(dto.fees.map((f) => f.studentId)) },
        },
        relations: ['student'],
      });
      for (const f of dto.fees) {
        const current = existing.find((e) => e.student.id === f.studentId);
        await manager.save(
          manager.create(StudentFee, {
            id: current?.id,
            term: { id: term.id },
            student: { id: f.studentId },
            outstanding: f.outstanding,
          }),
        );
      }
    });
    return { saved: dto.fees.length };
  }

  async outstandingFor(studentId: string, termId: string) {
    const fee = await this.feeRepository.findOne({
      where: { student: { id: studentId }, term: { id: termId } },
    });
    return fee?.outstanding ?? 0;
  }

  // The fee line printed at the bottom of a report sheet.
  async reportFees(studentId: string, termId: string, classId: string | null) {
    const [outstanding, bill] = await Promise.all([
      this.outstandingFor(studentId, termId),
      classId
        ? this.billRepository.findOne({
            where: { term: { id: termId }, schoolClass: { id: classId } },
          })
        : null,
    ]);
    return {
      outstanding,
      nextTermTuition: bill
        ? bill.tuition + bill.otherCharges.reduce((s, c) => s + c.amount, 0)
        : 0,
      ict: bill?.ict ?? 0,
    };
  }

  private async outstandingMap(termId: string, studentIds: string[]) {
    if (!studentIds.length) return new Map<string, number>();
    const fees = await this.feeRepository.find({
      where: { term: { id: termId }, student: { id: In(studentIds) } },
      relations: ['student'],
    });
    return new Map(fees.map((f) => [f.student.id, f.outstanding]));
  }

  // The term asked for, otherwise the active one.
  private async resolveTerm(termId?: string) {
    const term = termId
      ? await this.termRepository.findOne({
          where: { id: termId },
          relations: ['academicYear'],
        })
      : await this.termRepository.findOne({
          where: { isCurrent: true },
          relations: ['academicYear'],
        });
    if (!term)
      throw new NotFoundException(
        termId ? 'Term not found' : 'There is no active term',
      );
    return term;
  }

  private termView(term: Term) {
    return {
      id: term.id,
      label: `${term.academicYear.name} · ${term.name}`,
      status: term.status,
    };
  }
}
