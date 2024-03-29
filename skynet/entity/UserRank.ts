import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class UserRank {
    @PrimaryGeneratedColumn()
    id!: string;

    @Column({ type: "varchar", length: 19, array: true })
    guild_ids!: string[];

    @Column({ type: "varchar", length: 19, nullable: true })
    discord_id!: string;

    @Column({ type: "int2", nullable: true })
    rank?: number;

    @Column({ type: "varchar", nullable: true })
    user_name?: string;
}
