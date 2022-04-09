import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

import { Command, CommandData, Guard } from "../../decorators";
import { commandChannelGuard } from "../../guard/commandChannelGuard";

export class Remind {
    @CommandData({ type: "global" })
    remindData() {
        return new SlashCommandBuilder()
            .setName("remind")
            .setDescription("Schedule a reminder")
            .addIntegerOption((option) =>
                option
                    .setName("minutes")
                    .setDescription(
                        "Number of minutes after which to remind you"
                    )
                    .setRequired(true)
            )
            .addStringOption((option) =>
                option
                    .setName("message")
                    .setDescription(
                        "Message that should accompany the reminder"
                    )
                    .setRequired(false)
            )
            .toJSON();
    }

    @Command({ name: "remind" })
    @Guard({ body: commandChannelGuard })
    async remind(interaction: CommandInteraction): Promise<void> {
        const minutes = interaction.options.getInteger("minutes", true);
        if (minutes < 1) {
            await interaction.reply({
                ephemeral: true,
                content: "minutes needs to be at least 1",
            });
            return;
        }
        await interaction.reply({ content: "Not implemented" });
    }
}
