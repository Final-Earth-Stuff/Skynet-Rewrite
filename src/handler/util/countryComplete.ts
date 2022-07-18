import { ApplicationCommandOptionChoiceData } from "discord.js";

import fuzzysort from "fuzzysort";
const { go } = fuzzysort;

import { unwrap } from "../../util/assert";
import { CompletionProvider, Completion } from "../../decorators";
import { Data } from "../../map";

@CompletionProvider()
export class CountryComplete {
    @Completion("country")
    async countryComplete(
        value: string
    ): Promise<ApplicationCommandOptionChoiceData[]> {
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
