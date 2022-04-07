import { EntityRepository, Repository } from "typeorm";
import { LandAndFacilities } from "../entity/LandAndFacilities";

@EntityRepository(LandAndFacilities)
export class LandAndFacilitiesRepository extends Repository<LandAndFacilities> {
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
    }

    getSpawnFactories(timestamp: Date) {
        return this.manager
            .createQueryBuilder(LandAndFacilities, "land_and_facilities")
            .addSelect("land_and_facilities.country", "country")
            .addSelect("land_and_facilities.facs", "facs")
            .addSelect("max(land_and_facilities.timestamp")
            .where("land_and_facilities.timestamp < :timestamp", { timestamp })
            .andWhere("land_and_facilities.is_spawn = :isSpawn", {
                isSpawn: true,
            })
            .groupBy("land_and_facilities.country")
            .getMany();
    }
}
