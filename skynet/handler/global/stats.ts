import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
} from "discord.js";

import { CommandHandler, Command, CommandData } from "../../decorators";

import { Color } from "../../service/util/constants";
import type { UserData, PrivateUserData } from "../../wrapper/models/user";
import { ApiWrapper } from "../../wrapper/wrapper";
import { rankMap } from "../../service/util/constants";

@CommandHandler({ name: "stats" })
export class Stats {
    @CommandData({ type: "global" })
    readonly data = new SlashCommandBuilder()
        .setName("stats")
        .setDescription("Display your current training statistics")
        .toJSON();

    @Command()
    async stats(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply();

        const userWrapper = await ApiWrapper.forDiscordId(interaction.user.id);
        const userData = await userWrapper.getUser();

        await interaction.editReply({
            embeds: [buildStatsEmbed(userData)],
        });
    }
}

function buildStatsEmbed(user: UserData & PrivateUserData): EmbedBuilder {
    const rank = rankMap.get(user.rank) ?? "";

    return new EmbedBuilder()
        .setTitle(`${rank} ${user.name} [${user.id}]`)
        .addFields(
            {
                name: "Strength",
                value: `${user.statistics.strength}`,
                inline: true,
            },
            {
                name: "Intelligence",
                value: `${user.statistics.intelligence}`,
                inline: true,
            },
            {
                name: "Leadership",
                value: `${user.statistics.leadership}`,
                inline: true,
            },
            {
                name: "Communication",
                value: `${user.statistics.communication}`,
                inline: true,
            }
        )
        .setColor(Color.BLUE);
}
