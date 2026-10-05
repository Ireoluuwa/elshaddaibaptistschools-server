import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBursary1791212421565 implements MigrationInterface {
  name = 'AddBursary1791212421565';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "student_fees" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "outstanding" integer NOT NULL DEFAULT '0', "termId" uuid NOT NULL, "studentId" uuid NOT NULL, CONSTRAINT "UQ_7bd23190aa374121606d23c9178" UNIQUE ("termId", "studentId"), CONSTRAINT "PK_a2cec5273eddb36c724e226cf13" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "class_bills" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "tuition" integer NOT NULL DEFAULT '0', "ict" integer NOT NULL DEFAULT '0', "otherCharges" jsonb NOT NULL DEFAULT '[]', "termId" uuid NOT NULL, "schoolClassId" uuid NOT NULL, CONSTRAINT "UQ_27bb3283aa2ea5fa4da6c5c5476" UNIQUE ("termId", "schoolClassId"), CONSTRAINT "PK_474224c5b7e9fec0a176f0caba6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_fees" ADD CONSTRAINT "FK_23f9ab90eb846bb4df6548fb7fc" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_fees" ADD CONSTRAINT "FK_a63f486c4c8249ac8d72e17f9e1" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_bills" ADD CONSTRAINT "FK_0d9e0d0f44154ee8d9ff27dd852" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_bills" ADD CONSTRAINT "FK_0a32ca10bac3b3008ac7ae6f940" FOREIGN KEY ("schoolClassId") REFERENCES "school_classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "class_bills" DROP CONSTRAINT "FK_0a32ca10bac3b3008ac7ae6f940"`,
    );
    await queryRunner.query(
      `ALTER TABLE "class_bills" DROP CONSTRAINT "FK_0d9e0d0f44154ee8d9ff27dd852"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_fees" DROP CONSTRAINT "FK_a63f486c4c8249ac8d72e17f9e1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_fees" DROP CONSTRAINT "FK_23f9ab90eb846bb4df6548fb7fc"`,
    );
    await queryRunner.query(`DROP TABLE "class_bills"`);
    await queryRunner.query(`DROP TABLE "student_fees"`);
  }
}
