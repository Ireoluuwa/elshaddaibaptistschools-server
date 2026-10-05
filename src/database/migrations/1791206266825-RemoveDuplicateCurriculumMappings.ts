import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveDuplicateCurriculumMappings1791206266825 implements MigrationInterface {
  name = 'RemoveDuplicateCurriculumMappings1791206266825';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "curriculum_mappings" m
      USING "curriculum_mappings" dup
      WHERE m."schoolClassId" = dup."schoolClassId"
        AND m."subjectId" = dup."subjectId"
        AND m."departmentId" IS NOT DISTINCT FROM dup."departmentId"
        AND m."id" > dup."id"
    `);
  }

  // Removed duplicates aren't restored.
  public async down(): Promise<void> {}
}
