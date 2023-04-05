import { Column, PrimaryGeneratedColumn, Entity, ManyToOne } from "typeorm";
import { UserSettings } from "./UserSettings.js";

@Entity()
export class Reminder {
    @PrimaryGeneratedColumn()
    id!: string;

    @Column({ nullable: true })
    message?: string;

    @Column({ type: "timestamp without time zone" })
    timestamp!: Date;

    @ManyToOne(() => UserSettings, (user) => user.reminders, {
        onDelete: "CASCADE",
    })
    user!: UserSettings;
}
