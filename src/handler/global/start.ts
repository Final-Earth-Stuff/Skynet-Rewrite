import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder,
} from "discord.js";

import { CommandHandler, Command, CommandData } from "../../decorators";
import { UserSettingsRepository } from "../../repository/UserSettingsRepository";
import { getUser } from "../../wrapper/wrapper";
import { ApiError, BotError } from "../../error";
import { Color } from "../../service/util/constants";

@CommandHandler({ name: "start" })
export class Start {
    @CommandData({ type: "global" })
    readonly data = new SlashCommandBuilder()
        .setName("start")
        .setDescription(
            "Add api key to bot to start using notification functions"
        )
        .setDefaultMemberPermissions(0)
        .addStringOption((option) =>
            option
                .setName("apikey")
                .setDescription("Your api key")
                .setRequired(true)
        )
        .toJSON();

    @Command()
    async start(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });
        const apiKey = interaction.options.getString("apikey", true);
        if (apiKey.length != 10) {
            throw new BotError(
                "API keys must be 10 characters, please check your key and try again.",
                {
                    ephemeral: true,
                }
            );
        }
        let user;
        try {
            user = await getUser(apiKey);
        } catch (e) {
            if (e instanceof ApiError && e.code === 1) {
                throw new BotError(
                    "This is not a valid API key, please check your key and try again.",
                    {
                        ephemeral: true,
                    }
                );
            }
            throw new BotError(
                "Something went wrong with calling the API, please check your key and try again.",
                {
                    ephemeral: true,
                }
            );
        }
        UserSettingsRepository.saveSettings(
            interaction.user.id,
            apiKey,
            true,
            parseInt(user.id)
        );
        const success = new EmbedBuilder()
            .setDescription(`Successfully saved user data!`)
            .setColor(Color.GREEN);
        await interaction.editReply({ embeds: [success] });
        return;
    }
}
