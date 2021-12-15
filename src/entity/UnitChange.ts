import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity()
@Index(["country", "timestamp"])
export class UnitChange {
    @PrimaryGeneratedColumn()
    id!: number;
    
    @Column()
    country!: number;

    @Column({ nullable: true })
    previous_country?: number;

    @Column()
    axis!: number;

    @Column()
    allies!: number;

    @Column()
    delta_axis!: number;

    @Column()
    delta_allies!: number;

    @Column()
    timestamp!: Date;
}