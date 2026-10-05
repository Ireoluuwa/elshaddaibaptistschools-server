import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnrollments1791197377743 implements MigrationInterface {
  name = 'AddEnrollments1791197377743';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."enrollments_outcome_enum" AS ENUM('promoted', 'repeated', 'graduated', 'withdrawn')`,
    );
    await queryRunner.query(
      `CREATE TABLE "enrollments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "outcome" "public"."enrollments_outcome_enum", "studentId" uuid NOT NULL, "academicYearId" uuid NOT NULL, "schoolClassId" uuid NOT NULL, "departmentId" uuid, CONSTRAINT "UQ_5d39869ee222b8d89a4573756e0" UNIQUE ("studentId", "academicYearId"), CONSTRAINT "PK_7c0f752f9fb68bf6ed7367ab00f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD CONSTRAINT "FK_bf3ba3dfa95e2df7388eb4589fd" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD CONSTRAINT "FK_84ea0d198b4c80d8bf7b07bd7a4" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD CONSTRAINT "FK_af2b7e6c064b4afe4ec1bc70168" FOREIGN KEY ("schoolClassId") REFERENCES "school_classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD CONSTRAINT "FK_869338e2b5cc68d426a4901ed35" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    // Record every existing student's current class against the current session.
    await queryRunner.query(`
            INSERT INTO "enrollments" ("studentId", "academicYearId", "schoolClassId", "departmentId")
            SELECT sp."id", y."id", sp."schoolClassId", sp."departmentId"
            FROM "student_profiles" sp
            CROSS JOIN "academic_years" y
            WHERE y."isCurrent" = true AND sp."schoolClassId" IS NOT NULL
            ON CONFLICT ("studentId", "academicYearId") DO NOTHING
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP CONSTRAINT "FK_869338e2b5cc68d426a4901ed35"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP CONSTRAINT "FK_af2b7e6c064b4afe4ec1bc70168"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP CONSTRAINT "FK_84ea0d198b4c80d8bf7b07bd7a4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP CONSTRAINT "FK_bf3ba3dfa95e2df7388eb4589fd"`,
    );
    await queryRunner.query(`DROP TABLE "enrollments"`);
    await queryRunner.query(`DROP TYPE "public"."enrollments_outcome_enum"`);
  }
}
