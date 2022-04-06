import { Entity, PrimaryColumn, Column, OneToMany, JoinColumn } from "typeorm";

import { Permission } from "./Permission";

@Entity()
export class Command {
    @PrimaryColumn({ type: "char", length: 18 })
    command_id!: string;

    @Column({ type: "varchar", length: 20 })
    command_name!: string;

    @Column({ type: "char", length: 18 })
    guild_id!: string;

    @OneToMany(() => Permission, (permission) => permission.command)
    @JoinColumn({ name: "command_id", referencedColumnName: "command_id" })
    permissions!: Promise<Permission[]>;
}
