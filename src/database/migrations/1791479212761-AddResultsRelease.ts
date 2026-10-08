import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResultsRelease1791479212761 implements MigrationInterface {
  name = 'AddResultsRelease1791479212761';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "terms" ADD "resultsReleasedAt" TIMESTAMP WITH TIME ZONE`,
    );
    // Terms that have started keep showing results, so nothing students can see today disappears.
    await queryRunner.query(
      `UPDATE "terms" SET "resultsReleasedAt" = now() WHERE "status" <> 'upcoming'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "terms" DROP COLUMN "resultsReleasedAt"`,
    );
  }
}
