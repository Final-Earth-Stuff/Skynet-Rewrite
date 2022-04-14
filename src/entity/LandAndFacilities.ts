import { Column, Entity, PrimaryGeneratedColumn, Index } from "typeorm";

@Entity()
@Index("laf_country_ts", { synchronize: false })
export class LandAndFacilities {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "int2" })
    country!: number;

    @Column({ type: "int4" })
    land!: number;

    @Column({ type: "int4" })
    rigs!: number;

    @Column({ type: "int4" })
    facs!: number;

    @Column({ type: "int4" })
    mines!: number;

    @Column({ type: "int4" })
    ads!: number;

    @Column({ type: "int4" })
    gds!: number;

    @Column()
    is_active_spawn!: boolean;

    @Column({ type: "timestamp without time zone" })
    timestamp!: Date;

    @Column()
    control!: number;
}
