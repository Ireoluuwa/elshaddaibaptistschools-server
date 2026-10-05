import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPromotionLinks1791210846337 implements MigrationInterface {
  name = 'AddPromotionLinks1791210846337';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "school_classes" ADD "nextClassId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD "nextDepartmentId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "school_classes" ADD CONSTRAINT "FK_9d8c4796fdbca6330298b282a20" FOREIGN KEY ("nextClassId") REFERENCES "school_classes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD CONSTRAINT "FK_d941d0dc035095f0b355d7489cb" FOREIGN KEY ("nextDepartmentId") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    // Standard progression; the final class (SS3) keeps null and graduates.
    await queryRunner.query(`
            UPDATE "school_classes" c SET "nextClassId" = n."id"
            FROM "school_classes" n
            WHERE (c."name", n."name") IN (('JSS1','JSS2'), ('JSS2','JSS3'), ('JSS3','SS1'), ('SS1','SS2'), ('SS2','SS3'))
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP CONSTRAINT "FK_d941d0dc035095f0b355d7489cb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "school_classes" DROP CONSTRAINT "FK_9d8c4796fdbca6330298b282a20"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP COLUMN "nextDepartmentId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "school_classes" DROP COLUMN "nextClassId"`,
    );
  }
}
