import { MigrationInterface, QueryRunner } from "typeorm";

export class migration1661360555819 implements MigrationInterface {
    name = "migration1661360555819";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "guild"
            ADD COLUMN "auto_role" varchar(19);
            `
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "guild" 
            DROP COLUMN "auto_role" varchar(19);
            `
        );
    }
}
