import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVpRemarkToResults1791209931792 implements MigrationInterface {
  name = 'AddVpRemarkToResults1791209931792';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "terminal_results" ADD "vpRemark" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "terminal_results" DROP COLUMN "vpRemark"`,
    );
  }
}
