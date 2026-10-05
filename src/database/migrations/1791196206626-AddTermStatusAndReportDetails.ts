import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTermStatusAndReportDetails1791196206626 implements MigrationInterface {
    name = 'AddTermStatusAndReportDetails1791196206626'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."terms_status_enum" AS ENUM('upcoming', 'active', 'closed')`);
        await queryRunner.query(`ALTER TABLE "terms" ADD "status" "public"."terms_status_enum" NOT NULL DEFAULT 'upcoming'`);
        await queryRunner.query(`ALTER TABLE "terms" ADD "signatureUrl" text`);
        await queryRunner.query(`ALTER TABLE "terms" ADD "signedDate" date`);
        await queryRunner.query(`ALTER TABLE "terms" ADD "vacationDate" date`);
        await queryRunner.query(`ALTER TABLE "terms" ADD "resumptionDate" date`);

        // Derive status for existing terms.
        await queryRunner.query(`UPDATE "terms" SET "status" = 'active' WHERE "isCurrent" = true`);
        await queryRunner.query(`UPDATE "terms" SET "status" = 'closed' WHERE "isCurrent" = false AND "endDate" < CURRENT_DATE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "terms" DROP COLUMN "resumptionDate"`);
        await queryRunner.query(`ALTER TABLE "terms" DROP COLUMN "vacationDate"`);
        await queryRunner.query(`ALTER TABLE "terms" DROP COLUMN "signedDate"`);
        await queryRunner.query(`ALTER TABLE "terms" DROP COLUMN "signatureUrl"`);
        await queryRunner.query(`ALTER TABLE "terms" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."terms_status_enum"`);
    }

}
