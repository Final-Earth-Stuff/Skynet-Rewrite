import { AutocompleteInteraction } from "discord.js";

import { Autocomplete } from "../../decorators";
import { fuzzySearchCountries } from "../../map";

export class CountryComplete {
    @Autocomplete({})
    async countryComplete(interaction: AutocompleteInteraction): Promise<void> {
        const input = interaction.options.getFocused(true);
        const results = await fuzzySearchCountries(input.name);

        await interaction.respond(results);
    }
}
