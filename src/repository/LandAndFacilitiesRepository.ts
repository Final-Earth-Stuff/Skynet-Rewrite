import { LandAndFacilities } from "../entity/LandAndFacilities";
import { Country, Region } from "../entity/Country";
import { unwrap } from "../util/assert";

import { AppDataSource } from "../";

export interface FacQueryRow {
    country: number;
    diff: number;
    team_control: number;
    name: string;
}

export interface TotalsQueryRow {
    total_allies_facs: number;
    total_axis_facs: number;
    total_allies_rigs: number;
    total_axis_rigs: number;
    total_allies_mines: number;
    total_axis_mines: number;

    allies_capped: number;
    axis_capped: number;
    allies_uncapped: number;
    axis_uncapped: number;

    total_allies: number;
    total_axis: number;
}

export const LandAndFacilitiesRepository = AppDataSource.getRepository(
    LandAndFacilities
).extend({
    updateWorld(world: Omit<LandAndFacilities, "id">[]) {
        return this.manager.insert(LandAndFacilities, world);
    },

    getLastWorld() {
        return this.manager
            .createQueryBuilder(LandAndFacilities, "land_and_facilities")
            .distinctOn(["land_and_facilities.country"])
            .select()
            .orderBy("land_and_facilities.country")
            .addOrderBy("land_and_facilities.timestamp", "DESC")
            .getMany();
    },

    async getSpawnFactories(timestamp: Date): Promise<FacQueryRow[]> {
        const past = AppDataSource.createQueryBuilder()
            .from(LandAndFacilities, "laf")
            .addSelect("laf.country", "country")
            .addSelect("laf.facs", "facs")
            .distinctOn(["laf.country"])
            .where("timestamp < :timestamp", { timestamp })
            .addOrderBy("laf.country")
            .addOrderBy("laf.timestamp", "DESC");

        const current = AppDataSource.createQueryBuilder()
            .from(LandAndFacilities, "laf")
            .addSelect("laf.country", "country")
            .addSelect("laf.facs", "facs")
            .addSelect("laf.is_spawn", "is_spawn")
            .addSelect("laf.team_control", "team_control")
            .distinctOn(["laf.country"])
            .addOrderBy("laf.country")
            .addOrderBy("laf.timestamp", "DESC");

        const query = AppDataSource.createQueryBuilder()
            .from("current", "current")
            .innerJoin("past", "past", "past.country=current.country")
            .innerJoin(Country, "country", "country.id=current.country")
            .addCommonTableExpression(past, "past")
            .addCommonTableExpression(current, "current")
            .addSelect("current.country", "country")
            .addSelect("current.facs - past.facs", "diff")
            .addSelect("current.team_control", "team_control")
            .addSelect("country.name", "name")
            .where("current.is_spawn");

        return await query.getRawMany();
    },

    async totals(region?: Region): Promise<TotalsQueryRow> {
        const lastFacilities = AppDataSource.createQueryBuilder()
            .from("land_and_facilities", "laf")
            .addSelect("laf.country", "country")
            .addSelect("laf.facs", "facs")
            .addSelect("laf.rigs", "rigs")
            .addSelect("laf.mines", "mines")
            .addSelect("laf.team_control", "control")
            .distinctOn(["laf.country"])
            .addOrderBy("laf.country")
            .addOrderBy("laf.timestamp", "DESC");

        const lastUnits = AppDataSource.createQueryBuilder()
            .from("unit_change", "uc")
            .addSelect("uc.allies", "allies")
            .addSelect("uc.axis", "axis")
            .addSelect("uc.country", "country")
            .distinctOn(["uc.country"])
            .addOrderBy("uc.country")
            .addOrderBy("uc.timestamp", "DESC");

        const query = AppDataSource.createQueryBuilder()
            .addCommonTableExpression(lastFacilities, "lf")
            .addCommonTableExpression(lastUnits, "lu")
            .addSelect(
                "sum(case lf.control when 0 then lf.facs end)",
                "total_axis_facs"
            )
            .addSelect(
                "sum(case lf.control when 100 then lf.facs end)",
                "total_allies_facs"
            )
            .addSelect(
                "sum(case lf.control when 0 then lf.mines end)",
                "total_axis_mines"
            )
            .addSelect(
                "sum(case lf.control when 100 then lf.mines end)",
                "total_allies_mines"
            )
            .addSelect(
                "sum(case lf.control when 0 then lf.rigs end)",
                "total_axis_rigs"
            )
            .addSelect(
                "sum(case lf.control when 100 then lf.rigs end)",
                "total_allies_rigs"
            )
            .addSelect("sum(case lf.control when 0 then 1 end)", "axis_capped")
            .addSelect(
                "sum(case lf.control when 100 then 1 end)",
                "allies_capped"
            )
            .addSelect(
                "sum(case when lf.control between 1 and 49 then 1 end)",
                "axis_uncapped"
            )
            .addSelect(
                "sum(case when lf.control between 51 and 99 then 1 end)",
                "allies_uncapped"
            )
            .addSelect("sum(lu.axis)", "total_axis")
            .addSelect("sum(lu.allies)", "total_allies")
            .from(Country, "country")
            .innerJoin("lf", "lf", "country.id=lf.country")
            .leftJoin("lu", "lu", "country.id=lu.country");

        if (region) {
            query.where("country.region=:region", { region });
        }

        return unwrap(await query.getRawOne());
    },
});
