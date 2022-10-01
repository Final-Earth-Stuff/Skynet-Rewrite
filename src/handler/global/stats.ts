import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
} from "discord.js";

import { CommandHandler, Command, CommandData } from "../../decorators";

import { Color } from "../../service/util/constants";
import type { UserData, PrivateUserData } from "../../wrapper/models/user";
import { getUser } from "../../wrapper/wrapper";
import { rankMap } from "../../service/util/constants";
import { UserSettingsRepository } from "../../repository/UserSettingsRepository";
import { ApiError, BotError } from "../../error";
import { makeLogger } from "../../logger";

const logger = makeLogger(import.meta);

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
        const user = await UserSettingsRepository.getUserByDiscordId(
            interaction.user.id
        );

        if (!user?.valid_key || !user.api_key) {
            throw new BotError(
                "Please DM the bot the /start command to store  your API key in order to use this feature."
            );
        }
        let userData;
        try {
            userData = await getUser(user.api_key);
        } catch (e) {
            if (e instanceof ApiError && e.code === 1) {
                throw new BotError(
                    "This is not a valid API key, please check your key and try again."
                );
            }
            logger.warn("API returned error: %O", e);
            throw new BotError(
                "Something went wrong with calling the API, please check your key and try again."
            );
        }

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
