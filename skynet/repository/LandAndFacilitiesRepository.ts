import { LandAndFacilities } from "../entity/LandAndFacilities.js";
import { Country, Region } from "../entity/Country.js";
import { unwrap } from "../util/assert.js";

import { AppDataSource } from "../index.js";

export interface FacQueryRow {
    country: number;
    diff: number;
    control: number;
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

export interface IncomeQuery {
    allies_total: number;
    axis_total: number;
    allies: {
        name: string;
        num: number;
    }[];
    axis: {
        name: string;
        num: number;
    }[];
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
            .addSelect("laf.is_active_spawn", "is_active_spawn")
            .addSelect("laf.control", "control")
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
            .addSelect("current.control", "control")
            .addSelect("country.name", "name")
            .where("current.is_active_spawn");

        return await query.getRawMany();
    },

    async totals(region?: Region): Promise<TotalsQueryRow> {
        const lastFacilities = AppDataSource.createQueryBuilder()
            .from("land_and_facilities", "laf")
            .addSelect("laf.country", "country")
            .addSelect("laf.facs", "facs")
            .addSelect("laf.rigs", "rigs")
            .addSelect("laf.mines", "mines")
            .addSelect("laf.control", "control")
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
                "coalesce(sum(case lf.control when 0 then lf.facs end), 0)",
                "total_axis_facs"
            )
            .addSelect(
                "coalesce(sum(case lf.control when 100 then lf.facs end), 0)",
                "total_allies_facs"
            )
            .addSelect(
                "coalesce(sum(case lf.control when 0 then lf.mines end), 0)",
                "total_axis_mines"
            )
            .addSelect(
                "coalesce(sum(case lf.control when 100 then lf.mines end), 0)",
                "total_allies_mines"
            )
            .addSelect(
                "coalesce(sum(case lf.control when 0 then lf.rigs end), 0)",
                "total_axis_rigs"
            )
            .addSelect(
                "coalesce(sum(case lf.control when 100 then lf.rigs end), 0)",
                "total_allies_rigs"
            )
            .addSelect(
                "coalesce(sum(case lf.control when 0 then 1 end), 0)",
                "axis_capped"
            )
            .addSelect(
                "coalesce(sum(case lf.control when 100 then 1 end), 0)",
                "allies_capped"
            )
            .addSelect(
                "coalesce(sum(case when lf.control between 1 and 49 then 1 end), 0)",
                "axis_uncapped"
            )
            .addSelect(
                "coalesce(sum(case when lf.control between 51 and 99 then 1 end), 0)",
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

    async getFactories(): Promise<IncomeQuery[]> {
        const query = `select 
    to_json(coalesce(sum(facs) filter (where control=100), 0)) as allies_total,
    to_json(coalesce(sum(facs) filter (where control=0), 0)) as axis_total,
    json_agg(json_build_object('name', name, 'num', facs) order by facs desc) filter (where control=100) as allies,
    json_agg(json_build_object('name', name, 'num', facs) order by facs desc) filter (where control=0) as axis
from 
    country,
    lateral (select facs, control from land_and_facilities where country.id=country order by timestamp desc limit 1) as laf`;
        return (await AppDataSource.query(query)) as IncomeQuery[];
    },

    async getMines(): Promise<IncomeQuery[]> {
        const query = `select 
    to_json(coalesce(sum(mines) filter (where control=100), 0)) as allies_total,
    to_json(coalesce(sum(mines) filter (where control=0), 0)) as axis_total,
    json_agg(json_build_object('name', name, 'num', mines) order by mines desc) filter (where control=100) as allies,
    json_agg(json_build_object('name', name, 'num', mines) order by mines desc) filter (where control=0) as axis
from 
    country,
    lateral (select mines, control from land_and_facilities where country.id=country order by timestamp desc limit 1) as laf`;
        return (await AppDataSource.query(query)) as IncomeQuery[];
    },

    async getRigs(): Promise<IncomeQuery[]> {
        const query = `select 
    to_json(coalesce(sum(rigs) filter (where control=100), 0)) as allies_total,
    to_json(coalesce(sum(rigs) filter (where control=0), 0)) as axis_total,
    json_agg(json_build_object('name', name, 'num', rigs) order by rigs desc) filter (where control=100) as allies,
    json_agg(json_build_object('name', name, 'num', rigs) order by rigs desc) filter (where control=0) as axis
from 
    country,
    lateral (select rigs, control from land_and_facilities where country.id=country order by timestamp desc limit 1) as laf`;
        return (await AppDataSource.query(query)) as IncomeQuery[];
    },
});
