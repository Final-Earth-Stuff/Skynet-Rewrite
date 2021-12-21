import { Entity, PrimaryColumn, Column, ManyToOne } from "typeorm";

import { Command } from "./Command";

export enum PermissionType {
    ROLE = "role",
    USER = "user",
}

@Entity()
export class Permission {
    @PrimaryColumn({ type: "char", length: 18 })
    permission_id!: string;

    @Column({ type: "char", length: 18 })
    id!: string;

    @Column({ type: "enum", enum: PermissionType })
    type!: PermissionType;

    @ManyToOne(() => Command, (command) => command.permissions, {
        onDelete: "CASCADE",
        nullable: true,
    })
    command!: Promise<Command>;
}
