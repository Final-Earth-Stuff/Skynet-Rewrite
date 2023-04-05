import { UnitChange } from "../entity/UnitChange.js";
import { Region } from "../entity/Country.js";
import { Team } from "../service/util/constants.js";

import { AppDataSource } from "../index.js";

export interface RegionQueryRow {
    allies: number;
    axis: number;
    name: string;
    control: number;
}

export interface UnitQuery {
    countries: {
        id: number;
        allies: number;
        axis: number;
        name: string;
        control: number;
    }[];
    allies: number;
    axis: number;
    center_control: number;
}

export const UnitChangeRepository = AppDataSource.getRepository(
    UnitChange
).extend({
    updateUnits(world: Omit<UnitChange, "id">[]) {
        return this.manager.insert(UnitChange, world);
    },

    async getLastWorld(): Promise<UnitChange[]> {
        const query = `select current.* from country, 
lateral (select * from unit_change where country=country.id order by timestamp desc limit 1) as current`;

        return (await AppDataSource.query(query)) as UnitChange[];
    },

    async getRegion(region: Region, team?: Team): Promise<RegionQueryRow[]> {
        let query = `select
country.name,
lc.control,
uc.allies,
uc.axis,
uc.allies + uc.axis as total
from country,
lateral (select allies, axis from unit_change where country.id=country order by timestamp desc limit 1) as uc,
lateral (select control from land_and_facilities where country.id=country order by timestamp desc limit 1) as lc 
where region=$1
`;

        switch (team) {
            case Team.ALLIES:
                query += ` and allies <> 0 order by allies desc`;
                break;
            case Team.AXIS:
                query += ` and axis <> 0 order by axis desc`;
                break;
            default:
                query += ` and (allies <> 0 or axis <> 0) order by total desc`;
        }

        return (await AppDataSource.query(query, [region])) as RegionQueryRow[];
    },

    async getUnitsForCountries(
        ids: number[],
        center: number,
        team: Team
    ): Promise<UnitQuery[]> {
        const unitQuery = AppDataSource.createQueryBuilder()
            .subQuery()
            .from("unit_change", "uc")
            .addSelect("uc.allies", "allies")
            .addSelect("uc.axis", "axis")
            .where("uc.country=country.id")
            .orderBy("uc.timestamp", "DESC")
            .limit(1);

        const controlQuery = AppDataSource.createQueryBuilder()
            .subQuery()
            .from("land_and_facilities", "laf")
            .addSelect("laf.control", "control")
            .where("laf.country=country.id")
            .orderBy("laf.timestamp", "DESC")
            .limit(1);

        let filter: string;
        switch (team) {
            case Team.ALLIES:
                filter = " filter (where allies <> 0)";
                break;
            case Team.AXIS:
                filter = " filter (where axis <> 0)";
                break;
            default:
                filter = "";
        }

        // I CAPITULATE
        return (await AppDataSource.query(
            `select 
                coalesce(json_agg(
                    json_build_object('id', id, 'name', name, 'allies', allies, 'axis', axis, 'control', control)
                )${filter}, '[]'::json) as countries,
                to_json(coalesce(sum(allies), 0)) as allies,
                to_json(coalesce(sum(axis), 0)) as axis,
                to_json((select control from land_and_facilities where country=$1 order by "timestamp" desc limit 1)) as center_control
            from country, lateral ${unitQuery.getQuery()} units, lateral ${controlQuery.getQuery()} laf where id in (${ids
                .map((_, i) => `$${i + 2}`)
                .join(", ")})`,
            [center, ...ids]
        )) as UnitQuery[];
    },
});
