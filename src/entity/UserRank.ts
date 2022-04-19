import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class UserRank {
    @PrimaryGeneratedColumn()
    id!: string;

    @Column({ type: "char", length: 18, array: true })
    guild_ids!: string[];

    @Column({ type: "char", length: 18, nullable: true })
    discord_id!: string;

    @Column({ type: "int2", nullable: true })
    rank?: number;

    @Column({ type: "varchar", nullable: true })
    user_name?: string;
}
