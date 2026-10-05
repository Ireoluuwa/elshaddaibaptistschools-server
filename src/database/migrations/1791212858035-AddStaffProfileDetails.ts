import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStaffProfileDetails1791212858035 implements MigrationInterface {
  name = 'AddStaffProfileDetails1791212858035';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "staff_profiles" ADD "title" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff_profiles" ADD "position" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff_profiles" ADD "signatureUrl" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "staff_profiles" DROP COLUMN "signatureUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff_profiles" DROP COLUMN "position"`,
    );
    await queryRunner.query(`ALTER TABLE "staff_profiles" DROP COLUMN "title"`);
  }
}
