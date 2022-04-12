import { UnitChange } from "../entity/UnitChange";
import { Region, Country } from "../entity/Country";
import { LandAndFacilities } from "../entity/LandAndFacilities";
import { Team } from "../service/util/constants";

import { AppDataSource } from "../";

export interface RegionQueryRow {
    allies: number;
    axis: number;
    name: string;
    control: number;
}

export interface UnitQuery {
    id: number;
    allies: number;
    axis: number;
    name: string;
    control: number;
}

export const UnitChangeRepository = AppDataSource.getRepository(
    UnitChange
).extend({
    updateUnits(world: Omit<UnitChange, "id">[]) {
        return this.manager.insert(UnitChange, world);
    },

    getLastWorld(): Promise<UnitChange[]> {
        return this.manager
            .createQueryBuilder(UnitChange, "units")
            .distinctOn(["units.country"])
            .select()
            .orderBy("units.country")
            .addOrderBy("units.timestamp", "DESC")
            .getMany();
    },

    async getRegion(region: Region, team?: Team): Promise<RegionQueryRow[]> {
        const current = AppDataSource.createQueryBuilder()
            .distinctOn(["uc.country"])
            .from(UnitChange, "uc")
            .addSelect("uc.country", "country")
            .addSelect("uc.allies", "allies")
            .addSelect("uc.axis", "axis")
            .orderBy("uc.country")
            .addOrderBy("uc.timestamp", "DESC");

        const query = AppDataSource.createQueryBuilder()
            .addCommonTableExpression(current, "current")
            .from("current", "current")
            .innerJoin(Country, "country", "country.id=current.country")
            .addSelect("country.name", "name")
            .addSelect("current.allies", "allies")
            .addSelect("current.axis", "axis")
            .addSelect(
                (qb) =>
                    qb
                        .from(LandAndFacilities, "laf")
                        .select("laf.control", "control")
                        .where("laf.country=current.country")
                        .orderBy("timestamp", "DESC")
                        .limit(1),
                "control"
            )
            .where("country.region=:region", { region });

        switch (team) {
            case Team.ALLIES:
                query
                    .andWhere("current.allies <> 0")
                    .orderBy("current.allies", "DESC");
                break;
            case Team.AXIS:
                query
                    .andWhere("current.axis <> 0")
                    .orderBy("current.axis", "DESC");
                break;
            default:
                query
                    .addSelect("current.allies + current.axis", "total")
                    .andWhere("not (current.allies=0 and current.axis=0)")
                    .orderBy("total", "DESC");
        }

        return await query.getRawMany();
    },

    async getUnitsForCountries(
        ids: number[],
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

        let tail: string;
        switch (team) {
            case Team.ALLIES:
                tail = " and allies <> 0";
                break;
            case Team.AXIS:
                tail = " and axis <> 0";
                break;
            default:
                tail = "";
        }

        // I CAPITULATE
        return await AppDataSource.query(
            `select id, name, allies, axis, control from country, lateral ${unitQuery.getQuery()} units, lateral ${controlQuery.getQuery()} laf where id in (${ids
                .map((_, i) => `$${i + 1}`)
                .join(", ")})${tail}`,
            ids
        );
    },
});
