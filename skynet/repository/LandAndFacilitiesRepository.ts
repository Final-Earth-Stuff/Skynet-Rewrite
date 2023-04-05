import { LandAndFacilities } from "../entity/LandAndFacilities.js";
import { Region } from "../entity/Country.js";

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

    async getLastWorld(): Promise<LandAndFacilities[]> {
        const query = `select current.* from country, 
lateral (select * from land_and_facilities where country=country.id order by timestamp desc limit 1) as current`;

        return (await AppDataSource.query(query)) as LandAndFacilities[];
    },

    async getSpawnFactories(timestamp: Date): Promise<FacQueryRow[]> {
        const query = `with current as (
select c.country, c.facs, country.name, c.control from country, 
lateral (select * from land_and_facilities where country.id=country order by timestamp desc limit 1) as c where c.is_active_spawn
)
select current.facs - old.facs as diff, current.country, current.name, current.control from current, 
lateral (select facs from land_and_facilities where timestamp < $1 and country=current.country order by timestamp desc limit 1) as old
`;
        return (await AppDataSource.query(query, [timestamp])) as FacQueryRow[];
    },

    async totals(region?: Region): Promise<TotalsQueryRow> {
        let query = `select 
coalesce(sum(lu.axis)) as total_axis,
coalesce(sum(lu.allies)) as total_allies,
coalesce(sum(case lf.control when 0 then 1 end), 0) as axis_capped,
coalesce(sum(case lf.control when 100 then 1 end), 0) as allies_capped,
coalesce(sum(case when lf.control between 1 and 49 then 1 end), 0) as axis_uncapped,
coalesce(sum(case when lf.control between 51 and 99 then 1 end), 0) as allies_uncapped,
coalesce(sum(case lf.control when 0 then lf.rigs end), 0) as total_axis_rigs,
coalesce(sum(case lf.control when 100 then lf.rigs end), 0) as total_allies_rigs,
coalesce(sum(case lf.control when 0 then lf.facs end), 0) as total_axis_facs,
coalesce(sum(case lf.control when 100 then lf.facs end), 0) as total_allies_facs,
coalesce(sum(case lf.control when 0 then lf.mines end), 0) as total_axis_mines,
coalesce(sum(case lf.control when 100 then lf.mines end), 0) as total_allies_mines
from country,
lateral (select * from unit_change where country=country.id order by timestamp desc limit 1) as lu,
lateral (select * from land_and_facilities where country=country.id order by timestamp desc limit 1) as lf`;

        if (region) {
            query += `
            where region=$1`;
        }

        return (
            (await AppDataSource.query(
                query,
                region ? [region] : undefined
            )) as TotalsQueryRow[]
        )[0];
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
