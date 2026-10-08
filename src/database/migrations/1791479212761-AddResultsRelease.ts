import { MigrationInterface, QueryRunner } from "typeorm";

export class AddResultsRelease1791479212761 implements MigrationInterface {
    name = 'AddResultsRelease1791479212761'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "terms" ADD "resultsReleasedAt" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "terms" DROP COLUMN "resultsReleasedAt"`);
    }

}
