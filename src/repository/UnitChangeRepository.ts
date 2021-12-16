import { EntityRepository, Repository } from "typeorm";
import { UnitChange } from "../entity/UnitChange";

@EntityRepository(UnitChange)
export class UnitChangeRepository extends Repository<UnitChange> {
    createAndSaveUnits(
        country: number,
        previous_country: number,
        axis: number,
        allies: number,
        delta_axis: number,
        delta_allies: number,
        timestamp: Date
    ) {
        const unitChange = new UnitChange();
        unitChange.country = country;
        unitChange.previous_country = previous_country;
        unitChange.axis = axis;
        unitChange.allies = allies;
        unitChange.delta_allies = delta_allies;
        unitChange.delta_axis = delta_axis;
        unitChange.timestamp = timestamp;
        return this.manager.save(unitChange);
    }
}
