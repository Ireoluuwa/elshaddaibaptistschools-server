import { ForbiddenException } from '@nestjs/common';
import { Term } from './entities/term.entity';
import { TermStatus } from './enums/term-status.enum';

// A closed term is read-only for admins too, until it's reopened.
export function assertTermOpenForAdmin(term: Pick<Term, 'status'>) {
  if (term.status === TermStatus.CLOSED) {
    throw new ForbiddenException(
      'This term is closed. Reopen it in Sessions & Terms to make changes.',
    );
  }
}
