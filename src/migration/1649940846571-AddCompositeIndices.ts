import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCompositeIndices1649940846571 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `create index "uc_country_ts" on "unit_change" ("country", "timestamp" desc)`
        );
        await queryRunner.query(
            `create index "laf_country_ts" on "land_and_facilities" ("country", "timestamp" desc)`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`drop index "uc_country_ts"`);
        await queryRunner.query(`drop index "laf_country_ts"`);
    }
}
