import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
} from "discord.js";

import {
    CommandHandler,
    Command,
    CommandData,
} from "../../decorators/index.js";
import { UserSettingsRepository } from "../../repository/UserSettingsRepository.js";
import { Color } from "../../service/util/constants.js";

@CommandHandler({ name: "delete" })
export class Delete {
    @CommandData({ type: "global" })
    readonly data = new SlashCommandBuilder()
        .setName("delete")
        .setDescription("Delete your api key and personal data from the bot")
        .setDefaultMemberPermissions(0)
        .toJSON();

    @Command()
    async delete(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply();
        await UserSettingsRepository.deleteByDiscordId(interaction.user.id);
        const success = new EmbedBuilder()
            .setDescription(`All your data has been deleted.`)
            .setColor(Color.GREEN);
        await interaction.editReply({ embeds: [success] });
    }
}
