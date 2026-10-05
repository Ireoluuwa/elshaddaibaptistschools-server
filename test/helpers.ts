import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import migrationsDataSource from '../src/database/data-source';

export const PASSWORD = 'Test@1234';

// Wipes the test database and rebuilds it from the migrations.
export async function resetDatabase() {
  if (!process.env.DATABASE_URL?.includes('elshaddai_test')) {
    throw new Error('Refusing to reset a database that is not elshaddai_test');
  }
  const ds = migrationsDataSource;
  if (!ds.isInitialized) await ds.initialize();
  await ds.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await ds.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await ds.runMigrations();
  await ds.destroy();
}

// Same setup as main.ts.
export async function createApp() {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.setGlobalPrefix('api');
  app.useGlobalInterceptors(new TransformInterceptor(new Reflector()));
  await app.init();
  return app;
}

export interface Fixtures {
  termId: string;
  classes: Record<string, string>;
  departments: Record<string, string>;
  students: Record<string, string>;
}

// A small school: JSS1→JSS2→JSS3→SS1→SS2→SS3, one active term, one teacher per class teacher role.
export async function seed(app: INestApplication): Promise<Fixtures> {
  const db = app.get(DataSource);
  const hash = await bcrypt.hash(PASSWORD, 4);
  const one = async (sql: string, params: unknown[] = []) => (await db.query(sql, params))[0];

  const classes: Record<string, string> = {};
  for (const [name, senior] of [['JSS1', false], ['JSS2', false], ['JSS3', false], ['SS1', true], ['SS2', true], ['SS3', true]] as const) {
    classes[name] = (await one(`INSERT INTO school_classes (name, "isSenior") VALUES ($1, $2) RETURNING id`, [name, senior])).id;
  }
  const chain = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];
  for (let i = 0; i < chain.length - 1; i++) {
    await db.query(`UPDATE school_classes SET "nextClassId" = $1 WHERE id = $2`, [classes[chain[i + 1]], classes[chain[i]]]);
  }
  const departments: Record<string, string> = {};
  for (const name of ['Science', 'Art']) {
    departments[name] = (await one(`INSERT INTO departments (name) VALUES ($1) RETURNING id`, [name])).id;
  }

  const year = await one(`INSERT INTO academic_years (name, "isCurrent") VALUES ('2026/2027', true) RETURNING id`);
  const term = await one(
    `INSERT INTO terms (name, "startDate", "endDate", status, "isCurrent", "academicYearId")
     VALUES ('1st Term', '2026-09-14', '2026-12-18', 'active', true, $1) RETURNING id`,
    [year.id],
  );

  const user = async (username: string, role: string) =>
    (await one(`INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id`, [username, hash, role])).id;

  await user('admin', 'admin');
  await user('bursar', 'bursar');
  const teacherUser = await user('teacher', 'teacher');
  await db.query(
    `INSERT INTO teacher_profiles ("firstName", "lastName", "schoolClassId", "userId") VALUES ('Ada', 'Teacher', $1, $2)`,
    [classes.JSS1, teacherUser],
  );

  // name -> [class, department]
  const roster: Record<string, [string, string | null]> = {
    jss1a: ['JSS1', null],
    jss1b: ['JSS1', null],
    jss3a: ['JSS3', null],
    ss3a: ['SS3', 'Science'],
  };
  const students: Record<string, string> = {};
  for (const [name, [cls, dept]] of Object.entries(roster)) {
    const userId = await user(name, 'student');
    const student = await one(
      `INSERT INTO student_profiles ("firstName", "lastName", "dateOfBirth", "schoolClassId", "departmentId", "userId")
       VALUES ($1, 'Student', '2012-01-01', $2, $3, $4) RETURNING id`,
      [name, classes[cls], dept ? departments[dept] : null, userId],
    );
    students[name] = student.id;
    await db.query(
      `INSERT INTO enrollments ("studentId", "academicYearId", "schoolClassId", "departmentId") VALUES ($1, $2, $3, $4)`,
      [student.id, year.id, classes[cls], dept ? departments[dept] : null],
    );
  }

  return { termId: term.id, classes, departments, students };
}

export async function login(app: INestApplication, username: string) {
  const res = await request(app.getHttpServer()).post('/api/auth/login').send({ username, password: PASSWORD });
  return `Bearer ${res.body.data.access_token as string}`;
}

export const resultBody = (studentId: string, termId: string, status = 'PUBLISHED') => ({
  studentId,
  termId,
  scores: [{ subjectName: 'Mathematics', test1: 10, test2: 11, exam: 50 }],
  daysAttended: 60,
  totalDays: 65,
  status,
});
