import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity()
export class Command {
    @PrimaryColumn({ type: "char", length: 19 })
    command_id!: string;

    @Column({ type: "varchar", length: 20 })
    command_name!: string;

    @Column({ type: "char", length: 19 })
    guild_id!: string;
}
