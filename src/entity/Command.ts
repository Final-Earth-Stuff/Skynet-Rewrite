import { Entity, PrimaryColumn, Column, OneToMany, JoinColumn } from "typeorm";

@Entity()
export class Command {
    @PrimaryColumn({ type: "char", length: 18 })
    command_id!: string;

    @Column({ type: "varchar", length: 20 })
    command_name!: string;

    @Column({ type: "char", length: 18 })
    guild_id!: string;
}
