import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { UserSettingsRepository } from "../../repository/UserSettingsRepository";

import { CommandHandler, Command, CommandData, Guard } from "../../decorators";
import { Reminder } from "../../entity/Reminder";
import { AppDataSource } from "../..";
import { UserSettings } from "../../entity/UserSettings";

@CommandHandler({ name: "remind" })
export class Remind {
    @CommandData({ type: "global" })
    readonly data = new SlashCommandBuilder()
        .setName("remind")
        .setDescription("Schedule a reminder")
        .addIntegerOption((option) =>
            option
                .setName("minutes")
                .setDescription("Number of minutes after which to remind you")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("message")
                .setDescription("Message that should accompany the reminder")
                .setRequired(false)
        )
        .toJSON();

    @Command()
    async remind(interaction: CommandInteraction): Promise<void> {
        const minutes = interaction.options.getInteger("minutes", true);
        const message = interaction.options.getString("message", false);

        if (minutes < 1) {
            await interaction.reply({
                ephemeral: true,
                content: "Minutes needs to be at least 1",
            });
            return;
        }

        let user = await UserSettingsRepository.getUserByDiscordId(
            interaction.user.id
        );

        const minutesInMs = 60000 * minutes;

        if (!user) {
            user = new UserSettings();
            user.discord_id = interaction.user.id;
            UserSettingsRepository.save(user);
        }
        const reminder = new Reminder();
        if (message) {
            reminder.message = message;
        }
        reminder.timestamp = new Date(Date.now() + minutesInMs);
        reminder.user = user;
        const ReminderRepository = AppDataSource.getRepository(Reminder);

        ReminderRepository.save(reminder);

        await interaction.reply({
            content: `You will be reminded in ${minutes} minutes.`,
        });
    }
}
