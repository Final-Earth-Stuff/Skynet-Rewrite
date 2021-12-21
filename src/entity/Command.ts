import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany } from "typeorm";

import { Permission } from "./Permission";

@Entity()
export class Command {
    @PrimaryColumn({ type: "char", length: 18 })
    command_id!: string;

    @Column({ type: "varchar", length: 20 })
    command_name!: string;

    @Column({ type: "char", length: 18 })
    guild_id!: string;

    @ManyToOne(() => Command, (command) => command.sub_commands, {
        onDelete: "CASCADE",
        nullable: true,
    })
    parent_command!: Promise<Command>;

    @OneToMany(() => Command, (command) => command.parent_command)
    sub_commands!: Promise<Command[]>;

    @OneToMany(() => Permission, (permission) => permission.command)
    permissions!: Promise<Permission[]>;
}
