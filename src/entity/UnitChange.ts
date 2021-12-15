import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";


@Entity()
@Index(["country", "timestamp"])
export class UnitChange {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    country: number;

    @Column()
    previous_country: number | null;

    @Column ()
    axis: number;

    @Column()
    allies: number;

    @Column()
    delta_axis: number;

    @Column()
    delta_allies: number;

    @Column()
    timestamp: Date;
}