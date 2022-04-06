import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Index,
} from "typeorm";

import { Command } from "./Command";

export enum PermissionType {
    ROLE = "role",
    USER = "user",
}

@Entity()
@Index(["id", "command"], { unique: true })
export class Permission {
    @PrimaryGeneratedColumn()
    permission_id!: number;

    @Column({ type: "char", length: 18 })
    id!: string;

    @Column({ type: "enum", enum: PermissionType })
    type!: PermissionType;

    @ManyToOne(() => Command, (command) => command.permissions, {
        onDelete: "CASCADE",
        nullable: false,
    })
    @JoinColumn({ name: "command_id", referencedColumnName: "command_id" })
    command!: Command;
}
