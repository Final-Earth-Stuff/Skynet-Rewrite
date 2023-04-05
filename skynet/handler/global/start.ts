import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder,
} from "discord.js";

import {
    CommandHandler,
    Command,
    CommandData,
} from "../../decorators/index.js";
import { UserSettingsRepository } from "../../repository/UserSettingsRepository.js";
import { ApiWrapper } from "../../wrapper/wrapper.js";
import { ApiError, BotError } from "../../error.js";
import { Color } from "../../service/util/constants.js";

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
                "API keys must be 10 characters, please check your key and try again."
            );
        }
        let user;
        try {
            user = await ApiWrapper.forRaw(apiKey).getUser();
        } catch (e) {
            if (e instanceof ApiError && e.code === 1) {
                throw new BotError(
                    "This is not a valid API key, please check your key and try again."
                );
            } else {
                throw e;
            }
        }
        await UserSettingsRepository.saveSettings(
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
