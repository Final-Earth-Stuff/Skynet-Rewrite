import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

import { Command, CommandData, Guard } from "../../decorators";
import { commandChannelGuard } from "../../guard/commandChannelGuard";

export class Rigs {
    @CommandData({ type: "global" })
    rigsData() {
        return new SlashCommandBuilder()
            .setName("rigs")
            .setDescription("Shows shows a breakdown of oil rig income by team")
            .toJSON();
    }

    @Command({ name: "rigs" })
    @Guard({ body: commandChannelGuard })
    async rigs(interaction: CommandInteraction) {
        await interaction.reply({ content: "Not implemented" });
    }
}
