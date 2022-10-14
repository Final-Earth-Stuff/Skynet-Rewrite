import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity()
export class Command {
    @PrimaryColumn({ type: "varchar", length: 19 })
    command_id!: string;

    @Column({ type: "varchar", length: 20 })
    command_name!: string;

    @Column({ type: "varchar", length: 19 })
    guild_id!: string;
}
