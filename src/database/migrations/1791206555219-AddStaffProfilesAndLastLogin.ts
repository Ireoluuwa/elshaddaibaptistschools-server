import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStaffProfilesAndLastLogin1791206555219 implements MigrationInterface {
    name = 'AddStaffProfilesAndLastLogin1791206555219'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "staff_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "email" character varying, "phoneNumber" character varying, "userId" uuid, CONSTRAINT "REL_538ab8c582b6c827244952a292" UNIQUE ("userId"), CONSTRAINT "PK_6d4c6c0b447e39147b4a6dcbede" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" ADD "lastLoginAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "staff_profiles" ADD CONSTRAINT "FK_538ab8c582b6c827244952a2923" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "staff_profiles" DROP CONSTRAINT "FK_538ab8c582b6c827244952a2923"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastLoginAt"`);
        await queryRunner.query(`DROP TABLE "staff_profiles"`);
    }

}
