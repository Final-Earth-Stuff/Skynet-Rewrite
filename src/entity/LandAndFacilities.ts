import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class LandAndFacilities {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "int2" })
    country!: number;

    @Column()
    land!: number;

    @Column()
    rigs!: number;

    @Column()
    facs!: number;

    @Column()
    mines!: number;

    @Column()
    is_spawn!: boolean;

    @Column({ type: "timestamp without time zone" })
    timestamp!: Date;

    @Column()
    team_control!: number;
}
