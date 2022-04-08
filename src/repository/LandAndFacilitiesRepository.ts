import { LandAndFacilities } from "../entity/LandAndFacilities";

import { AppDataSource } from "../";

interface FacQueryRow {
    country: number;
    diff: number;
    team_control: number;
}

export const LandAndFacilitiesRepository = AppDataSource.getRepository(
    LandAndFacilities
).extend({
    createLandAndFacilities(
        country: number,
        land: number,
        rigs: number,
        facs: number,
        mines: number,
        isSpawn: boolean,
        teamControl: number,
        timestamp: Date
    ) {
        const landAndFacilities = new LandAndFacilities();
        landAndFacilities.country = country;
        landAndFacilities.land = land;
        landAndFacilities.rigs = rigs;
        landAndFacilities.facs = facs;
        landAndFacilities.mines = mines;
        landAndFacilities.is_spawn = isSpawn;
        landAndFacilities.timestamp = timestamp;
        landAndFacilities.team_control = teamControl;
        return this.manager.save(landAndFacilities);
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
            .addCommonTableExpression(past, "past")
            .addCommonTableExpression(current, "current")
            .addSelect("current.country", "country")
            .addSelect("current.facs - past.country", "diff")
            .addSelect("current.team_control", "team_control")
            .where("current.is_spawn");

        return await query.getRawMany();
    },
});
