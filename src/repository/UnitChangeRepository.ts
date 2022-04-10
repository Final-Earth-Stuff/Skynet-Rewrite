import { UnitChange } from "../entity/UnitChange";

import { AppDataSource } from "../";

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
});
