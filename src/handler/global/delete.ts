import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed } from "discord.js";

import { CommandHandler, Command, CommandData, Guard } from "../../decorators";
import { UserSettingsRepository } from "../../repository/UserSettingsRepository";
import { dmGuard } from "../../guard/dmGuard";
import { Color } from "../../service/util/constants";

@CommandHandler({ name: "delete" })
@Guard(dmGuard)
export class Delete {
    @CommandData({ type: "global" })
    readonly data = new SlashCommandBuilder()
        .setName("delete")
        .setDescription("Delete your api key and personal data from the bot")
        .toJSON();

    @Command()
    async delete(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        UserSettingsRepository.deleteByDiscordId(interaction.user.id);
        const success = new MessageEmbed()
            .setDescription(`All your data has been deleted.`)
            .setColor(Color.GREEN);
        await interaction.editReply({ embeds: [success] });
    }
}
