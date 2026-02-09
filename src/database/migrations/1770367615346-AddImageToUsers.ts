import { MigrationInterface, QueryRunner } from "typeorm";

export class AddImageToUsers1770367615346 implements MigrationInterface {
    name = 'AddImageToUsers1770367615346'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "image" character varying(500)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "image"`);
    }

}
