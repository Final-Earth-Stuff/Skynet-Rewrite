import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class Guild {
    @PrimaryColumn({ type: "varchar", length: 19 })
    guild_id!: string;

    @Column({ type: "varchar", length: 19, nullable: true })
    allies_role?: string;

    @Column({ type: "varchar", length: 19, nullable: true })
    axis_role?: string;

    @Column({ type: "varchar", length: 19, nullable: true })
    verified_role?: string;

    @Column({ type: "varchar", length: 19, nullable: true })
    spectator_role?: string;

    @Column({ type: "varchar", length: 19, nullable: true })
    auto_role?: string;

    @Column({ type: "varchar", length: 19, nullable: true })
    log_channel?: string;

    @Column({ type: "varchar", length: 19, nullable: true })
    verify_channel?: string;

    @Column({ type: "varchar", length: 19, array: true })
    command_channels!: string[];

    @Column({ type: "varchar", length: 19, nullable: true })
    troop_movement_channel?: string;

    @Column({ type: "varchar", length: 19, nullable: true })
    land_facility_channel?: string;

    @Column({ default: true })
    roles_enabled!: boolean;
}
