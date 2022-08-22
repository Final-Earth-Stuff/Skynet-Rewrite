import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class RankRole {
    @PrimaryGeneratedColumn()
    id!: string;

    @Column({ type: "varchar", length: 19 })
    guild_id?: string;

    @Column({ type: "int2", nullable: true })
    rank!: number;
}
