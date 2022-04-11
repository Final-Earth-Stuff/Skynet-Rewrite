import { CountryData } from "../wrapper/models/country";
import { LandAndFacilities } from "../entity/LandAndFacilities";

/**
 * @todo extend this to log changes to channel
 */
export function convertWorld(world: CountryData[]) {
    return world.map((country) => {
        return {
            country: parseInt(country.id),
            land: country.land,
            rigs: country.facilities.rigs,
            facs: country.facilities.factories,
            mines: country.facilities.mines,
            ads: country.facilities.airDefences,
            gds: country.facilities.groundDefences,
            is_active_spawn: country.isActiveSpawn,
            control: country.control,
            timestamp: new Date(),
        };
    });
}

export function compareCountry(
    c1: Omit<LandAndFacilities, "id">,
    c2: LandAndFacilities
) {
    return (
        c1.country === c2.country &&
        c1.land === c2.land &&
        c1.rigs === c2.rigs &&
        c1.facs === c2.facs &&
        c1.mines === c2.mines &&
        c1.is_active_spawn === c2.is_active_spawn &&
        c1.control === c2.control
    );
}
