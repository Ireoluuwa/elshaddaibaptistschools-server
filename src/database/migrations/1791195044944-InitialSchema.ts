import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1791195044944 implements MigrationInterface {
  name = 'InitialSchema1791195044944';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "school_classes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "isSenior" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_bdd22c83d22219556d673e8299d" UNIQUE ("name"), CONSTRAINT "PK_598176ed17a4f905e76f0eb4daf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "departments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, CONSTRAINT "UQ_8681da666ad9699d568b3e91064" UNIQUE ("name"), CONSTRAINT "PK_839517a681a86bb84cbcc6a1e9d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "student_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "dateOfBirth" date NOT NULL, "yearJoined" integer, "homeAddress" text, "guardianName" character varying, "guardianPhone" character varying, "guardianEmail" character varying, "avatarUrl" text, "schoolClassId" uuid, "departmentId" uuid, "userId" uuid, CONSTRAINT "REL_064d129936a1e821d637ee8c88" UNIQUE ("userId"), CONSTRAINT "PK_5ed0a32eeaddfe812fb326177d0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "teacher_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "firstName" character varying, "lastName" character varying, "email" character varying, "phoneNumber" character varying, "address" text, "avatarUrl" text, "schoolClassId" uuid, "departmentId" uuid, "userId" uuid, CONSTRAINT "REL_c30bc3401758faae4415391ea2" UNIQUE ("userId"), CONSTRAINT "PK_fdd17d62015e40674217a407484" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('student', 'teacher', 'bursar', 'vp', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "username" character varying NOT NULL, "password" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'student', "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "academic_years" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "isCurrent" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_645d0f115fa85aaecffdc11cbaa" UNIQUE ("name"), CONSTRAINT "PK_2021b90bfbfa6c9da7df34ca1cf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "terms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "startDate" date NOT NULL, "endDate" date NOT NULL, "isCurrent" boolean NOT NULL DEFAULT false, "academicYearId" uuid, CONSTRAINT "PK_33b6fe77d6ace7ff43cc8a65958" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."terminal_results_status_enum" AS ENUM('DRAFT', 'PUBLISHED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "terminal_results" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "scores" jsonb NOT NULL DEFAULT '[]', "daysAttended" integer NOT NULL DEFAULT '0', "totalDays" integer NOT NULL DEFAULT '65', "teacherRemark" text, "status" "public"."terminal_results_status_enum" NOT NULL DEFAULT 'DRAFT', "studentId" uuid, "termId" uuid, CONSTRAINT "UQ_db13af7f2ee10a15d8c7cc50dae" UNIQUE ("studentId", "termId"), CONSTRAINT "PK_30a679ff6c5e4feebd483c1a3f7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."weekly_reports_status_enum" AS ENUM('DRAFT', 'PUBLISHED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "weekly_reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "weekNumber" integer NOT NULL, "scores" jsonb NOT NULL DEFAULT '[]', "teacherRemark" text, "behavioralScore" integer NOT NULL DEFAULT '0', "attendance" integer NOT NULL DEFAULT '5', "percentage" double precision, "status" "public"."weekly_reports_status_enum" NOT NULL DEFAULT 'DRAFT', "studentId" uuid, "termId" uuid, CONSTRAINT "UQ_0fbd07aa6580c69a9f0771f8b30" UNIQUE ("studentId", "termId", "weekNumber"), CONSTRAINT "PK_1a8cd4b8d43d7a359597b75f792" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "assignments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "title" character varying NOT NULL, "description" text NOT NULL, "startDate" TIMESTAMP NOT NULL, "dueDate" TIMESTAMP NOT NULL, "attachmentUrl" character varying, "teacherId" uuid, "schoolClassId" uuid, CONSTRAINT "PK_c54ca359535e0012b04dcbd80ee" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "subjects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, CONSTRAINT "UQ_47a287fe64bd0e1027e603c335c" UNIQUE ("name"), CONSTRAINT "PK_1a023685ac2b051b4e557b0b280" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "curriculum_mappings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "schoolClassId" uuid, "departmentId" uuid, "subjectId" uuid, CONSTRAINT "PK_7c0d47064ec728bfaab06ccb418" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_profiles" ADD CONSTRAINT "FK_3af06507212c2f696d8fbf4dc5c" FOREIGN KEY ("schoolClassId") REFERENCES "school_classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_profiles" ADD CONSTRAINT "FK_6f3e2e394fadc29515389898327" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_profiles" ADD CONSTRAINT "FK_064d129936a1e821d637ee8c88e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_profiles" ADD CONSTRAINT "FK_0a213d1de93ab172ebbc1c15479" FOREIGN KEY ("schoolClassId") REFERENCES "school_classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_profiles" ADD CONSTRAINT "FK_cb0230ca75ff100a74f3d2bcc97" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_profiles" ADD CONSTRAINT "FK_c30bc3401758faae4415391ea23" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "terms" ADD CONSTRAINT "FK_e47d1cc89d00b393a59aed32b08" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "terminal_results" ADD CONSTRAINT "FK_f367b2b4973cc9b7e389e4a1dfb" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "terminal_results" ADD CONSTRAINT "FK_41780fcb09810e28fb3f5a759fc" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "weekly_reports" ADD CONSTRAINT "FK_b5399e95f9fb0fe02afab835834" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "weekly_reports" ADD CONSTRAINT "FK_47e0d0b4d89b95db1db9754300a" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignments" ADD CONSTRAINT "FK_e9a3111140d313859c9dfa8f22d" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignments" ADD CONSTRAINT "FK_f7864083e31507b3982a51c36eb" FOREIGN KEY ("schoolClassId") REFERENCES "school_classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_mappings" ADD CONSTRAINT "FK_1efbd9ead6e4718e2d5a8443231" FOREIGN KEY ("schoolClassId") REFERENCES "school_classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_mappings" ADD CONSTRAINT "FK_64fef67fc5e6bf78363de31d5ea" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_mappings" ADD CONSTRAINT "FK_25bb11646f1d1867104b8d99747" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "curriculum_mappings" DROP CONSTRAINT "FK_25bb11646f1d1867104b8d99747"`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_mappings" DROP CONSTRAINT "FK_64fef67fc5e6bf78363de31d5ea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "curriculum_mappings" DROP CONSTRAINT "FK_1efbd9ead6e4718e2d5a8443231"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignments" DROP CONSTRAINT "FK_f7864083e31507b3982a51c36eb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignments" DROP CONSTRAINT "FK_e9a3111140d313859c9dfa8f22d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "weekly_reports" DROP CONSTRAINT "FK_47e0d0b4d89b95db1db9754300a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "weekly_reports" DROP CONSTRAINT "FK_b5399e95f9fb0fe02afab835834"`,
    );
    await queryRunner.query(
      `ALTER TABLE "terminal_results" DROP CONSTRAINT "FK_41780fcb09810e28fb3f5a759fc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "terminal_results" DROP CONSTRAINT "FK_f367b2b4973cc9b7e389e4a1dfb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "terms" DROP CONSTRAINT "FK_e47d1cc89d00b393a59aed32b08"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_profiles" DROP CONSTRAINT "FK_c30bc3401758faae4415391ea23"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_profiles" DROP CONSTRAINT "FK_cb0230ca75ff100a74f3d2bcc97"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_profiles" DROP CONSTRAINT "FK_0a213d1de93ab172ebbc1c15479"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_profiles" DROP CONSTRAINT "FK_064d129936a1e821d637ee8c88e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_profiles" DROP CONSTRAINT "FK_6f3e2e394fadc29515389898327"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_profiles" DROP CONSTRAINT "FK_3af06507212c2f696d8fbf4dc5c"`,
    );
    await queryRunner.query(`DROP TABLE "curriculum_mappings"`);
    await queryRunner.query(`DROP TABLE "subjects"`);
    await queryRunner.query(`DROP TABLE "assignments"`);
    await queryRunner.query(`DROP TABLE "weekly_reports"`);
    await queryRunner.query(`DROP TYPE "public"."weekly_reports_status_enum"`);
    await queryRunner.query(`DROP TABLE "terminal_results"`);
    await queryRunner.query(
      `DROP TYPE "public"."terminal_results_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "terms"`);
    await queryRunner.query(`DROP TABLE "academic_years"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TABLE "teacher_profiles"`);
    await queryRunner.query(`DROP TABLE "student_profiles"`);
    await queryRunner.query(`DROP TABLE "departments"`);
    await queryRunner.query(`DROP TABLE "school_classes"`);
  }
}
