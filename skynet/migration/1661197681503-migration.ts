import { MigrationInterface, QueryRunner } from "typeorm";

export class migration1661197681503 implements MigrationInterface {
    name = "migration1661197681503";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "command" 
                ALTER COLUMN "command_id" TYPE varchar(19),
                ALTER COLUMN "guild_id" TYPE varchar(19)
            `
        );

        await queryRunner.query(
            `ALTER TABLE "rank_role" 
                ALTER COLUMN "guild_id" TYPE varchar(19)
            `
        );

        await queryRunner.query(
            `ALTER TABLE "guild" 
                ALTER COLUMN "guild_id" TYPE varchar(19),
                ALTER COLUMN "allies_role" TYPE varchar(19),
                ALTER COLUMN "axis_role" TYPE varchar(19),
                ALTER COLUMN "spectator_role" TYPE varchar(19),
                ALTER COLUMN "verified_role" TYPE varchar(19),
                ALTER COLUMN "log_channel" TYPE varchar(19),
                ALTER COLUMN "verify_channel" TYPE varchar(19),
                ALTER COLUMN "command_channels" TYPE varchar(19) array,
                ALTER COLUMN "troop_movement_channel" TYPE varchar(19),
                ALTER COLUMN "land_facility_channel" TYPE varchar(19)
            `
        );

        await queryRunner.query(
            `ALTER TABLE "user_rank" 
                ALTER COLUMN "guild_ids" TYPE varchar(19) array,
                ALTER COLUMN "discord_id" TYPE varchar(19) 
            `
        );
        await queryRunner.query(
            `ALTER TABLE "user_settings"
                ALTER COLUMN "discord_id" TYPE varchar(19)
            `
        );

        await queryRunner.query(
            `ALTER TABLE "reminder" 
                ALTER COLUMN "userDiscordId" TYPE varchar(19)
            `
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "command" 
                ALTER COLUMN "command_id" TYPE character(19),
                ALTER COLUMN "guild_id" TYPE character(19)
            `
        );

        await queryRunner.query(
            `ALTER TABLE "rank_role" 
                ALTER COLUMN "guild_id" TYPE character(19)
            `
        );

        await queryRunner.query(
            `ALTER TABLE "guild" 
                ALTER COLUMN "guild_id" TYPE character(19),
                ALTER COLUMN "allies_role" TYPE character(19),
                ALTER COLUMN "axis_role" TYPE character(19),
                ALTER COLUMN "spectator_role" TYPE character(19),
                ALTER COLUMN "verified_role" TYPE character(19),
                ALTER COLUMN "log_channel" TYPE character(19),
                ALTER COLUMN "verify_channel" TYPE character(19),
                ALTER COLUMN "command_channels" TYPE character(19) array,
                ALTER COLUMN "troop_movement_channel" TYPE character(19),
                ALTER COLUMN "land_facility_channel" TYPE character(19)
            `
        );

        await queryRunner.query(
            `ALTER TABLE "user_rank" 
                ALTER COLUMN "guild_ids" TYPE character(19) array,
                ALTER COLUMN "discord_id" TYPE character(19) 
            `
        );
        await queryRunner.query(
            `ALTER TABLE "user_settings"
                ALTER COLUMN "discord_id" TYPE character(19)
            `
        );

        await queryRunner.query(
            `ALTER TABLE "reminder" 
                ALTER COLUMN "userDiscordId" TYPE character(19)
            `
        );
    }
}
