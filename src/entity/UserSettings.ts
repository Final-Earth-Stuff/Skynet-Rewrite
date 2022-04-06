import { Column, PrimaryColumn, Entity } from "typeorm";

export enum Team {
    ALLIES = "allies",
    AXIS = "axis",
}

@Entity()
export class UserSettings {
    @PrimaryColumn({ type: "char", length: 18 })
    discord_id!: string;

    @Column({ type: "char", length: 10, nullable: true })
    api_key?: string;

    @Column({ default: false })
    valid_key!: boolean;

    @Column({ nullable: true })
    user_id?: number;

    @Column({ type: "enum", enum: Team, nullable: true })
    team?: Team;

    @Column({ type: "int2", nullable: true })
    country?: number;

    @Column({ type: "timestamp without time zone", array: true, default: [] })
    reminders!: Date[];

    @Column({ default: false })
    war_flag!: boolean;

    @Column({ default: false })
    queue_flag!: boolean;

    @Column({ default: false })
    mail_flag!: boolean;

    @Column({ default: false })
    event_flag!: boolean;

    @Column({ default: false })
    reimb_flag!: boolean;

    @Column({ default: false })
    enemy_flag!: boolean;

    @Column({ default: false })
    paused_flag!: boolean;

    @Column({ nullable: true })
    prev_war_notification?: Date;

    @Column({ nullable: true })
    prev_queue_notification?: Date;

    @Column({ nullable: true })
    prev_reimb_notification?: Date;

    @Column({ nullable: true })
    prev_enemies_notification?: Date;

    @Column({ nullable: true, type: "int2" })
    prev_num_events?: number;

    @Column({ nullable: true, type: "int2" })
    prev_num_mails?: number;

    @Column({ nullable: true })
    prev_num_enemies?: number;
}
