import { ApplicationCommandOptionChoice } from "discord.js";

import { go } from "fuzzysort";

import { unwrap } from "../../util/assert";
import { Completion } from "../../decorators";
import { Data } from "../../map";

export class CountryComplete {
    @Completion({ id: "country" })
    async countryComplete(
        value: string
    ): Promise<ApplicationCommandOptionChoice[]> {
        const results = go(value, Data.shared.preparedCountries, {
            limit: 10,
            allowTypo: false,
        }).map((r) => ({
            name: r.target,
            value: unwrap(Data.shared.idForCountry(r.target)),
        }));

        if (results.length === 0) {
            return Data.shared.preparedCountries.slice(0, 10).map((p) => ({
                name: p.target,
                value: unwrap(Data.shared.idForCountry(p.target)),
            }));
        }

        return results;
    }
}
