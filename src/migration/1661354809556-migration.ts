import { MigrationInterface, QueryRunner } from "typeorm";

export class migration1661354809556 implements MigrationInterface {
    name = "migration1661354809556";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "guild"
            ADD COLUMN "roles_enabled" BOOLEAN DEFAULT TRUE;
            `
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "guild" 
            DROP COLUMN "roles_enabled";
            `
        );
    }
}
