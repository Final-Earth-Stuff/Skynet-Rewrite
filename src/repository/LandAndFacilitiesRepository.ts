import { LandAndFacilities } from "../entity/LandAndFacilities";

import { AppDataSource } from "../";

export const LandAndFacilitiesRepository = AppDataSource.getRepository(
    LandAndFacilities
).extend({
    updateWorld(world: LandAndFacilities[]) {
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

    getSpawnFactories(timestamp: Date) {
        return this.manager
            .createQueryBuilder(LandAndFacilities, "land_and_facilities")
            .distinctOn(["land_and_facilities.country"])
            .select("land_and_facilities.country")
            .addSelect("land_and_facilities.facs")
            .where("land_and_facilities.timestamp < :timestamp", { timestamp })
            .andWhere("land_and_facilities.is_spawn = :isSpawn", {
                isSpawn: true,
            })
            .orderBy("land_and_facilities.country")
            .addOrderBy("land_and_facilities.timestamp")
            .getMany();
    },
});
