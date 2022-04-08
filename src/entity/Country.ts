import { Entity, Column, PrimaryColumn, Index } from "typeorm";

export enum Region {
    AFRICA = "africa",
    ASIA = "asia",
    ANTARCTICA = "antarctica",
    AUSTRALASIA = "australasia",
    CARIBBEAN = "caribbean",
    EUROPE = "europe",
    MIDDLE_EAST = "middle east",
    NORTH_AMERICA = "north america",
    SOUTH_AMERICA = "south america",
}

@Entity()
export class Country {
    @PrimaryColumn({ type: "int2" })
    id!: number;

    @Column({ type: "varchar", length: 100 })
    name!: string;

    @Column({ type: "char", length: 2 })
    code!: string;

    @Column({ type: "float8" })
    latitude!: number;

    @Column({ type: "float8" })
    longitude!: number;

    @Column({ type: "enum", enum: Region })
    @Index()
    region!: Region;
}
