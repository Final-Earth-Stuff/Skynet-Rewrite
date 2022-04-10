import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

import { Command, CommandData, Guard } from "../../decorators";
import { commandChannelGuard } from "../../guard/commandChannelGuard";

export class Totals {
    @CommandData({ type: "global" })
    totalsData() {
        return new SlashCommandBuilder()
            .setName("totals")
            .setDescription("Shows units, facilities and income by team")
            .toJSON();
    }

    @Command({ name: "totals" })
    @Guard({ body: commandChannelGuard })
    async totals(interaction: CommandInteraction) {
        await interaction.reply({ content: "Not implemented" });
    }
}
