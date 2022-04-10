import { LandAndFacilities } from "../entity/LandAndFacilities";
import { Country } from "../entity/Country";

import { AppDataSource } from "../";

export interface FacQueryRow {
    country: number;
    diff: number;
    team_control: number;
    name: string;
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
});
