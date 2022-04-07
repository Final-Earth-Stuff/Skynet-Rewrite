import { ApplicationCommandOptionChoice } from "discord.js";

import { Completion } from "../../decorators";
import { fuzzySearchCountries } from "../../map";

export class CountryComplete {
    @Completion({ id: "country" })
    async countryComplete(
        value: string
    ): Promise<ApplicationCommandOptionChoice[]> {
        return await fuzzySearchCountries(value);
    }
}
