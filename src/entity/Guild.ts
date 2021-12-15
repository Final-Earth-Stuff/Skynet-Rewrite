import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class Guild {
    @PrimaryColumn({ type: "char", length: 18 })
    guild_id!: string;

    @Column({ type: "char", length: 18, nullable: true })
    allies_role?: string;

    @Column({ type: "char", length: 18, nullable: true })
    axis_role?: string;

    @Column({ type: "char", length: 18, nullable: true })
    spectator_role?: string;

    @Column({ type: "char", length: 18, nullable: true })
    bot_admin_role?: string;

    @Column({ type: "char", length: 18, nullable: true })
    log_channel?: string;

    @Column({ type: "char", length: 18, nullable: true })
    verify_channel?: string;

    @Column({ type: "char", length: 18, array: true })
    command_channels!: string[];

    @Column({ type: "char", length: 18, nullable: true })
    troop_movement_channel?: string;

    @Column({ type: "char", length: 18, nullable: true })
    land_facility_channel?: string;
}
