import { Client, DiscordAPIError, EmbedBuilder } from "discord.js";
import { Reminder } from "../entity/Reminder.js";
import { makeLogger } from "../logger.js";
import { ReminderRepository } from "../repository/ReminderRepository.js";
import { Color } from "./util/constants.js";

const logger = makeLogger(import.meta);

export async function processReminder(reminder: Reminder, client: Client) {
    try {
        const discord = await client.users.fetch(reminder.user.discord_id);

        const embed = new EmbedBuilder()
            .setTitle("This is a Reminder!")
            .setDescription(reminder.message ? reminder.message : "Ping!")
            .setColor(Color.YELLOW);

        await discord.send({ embeds: [embed] });

        return parseInt(reminder.id);
    } catch (e) {
        if (e instanceof DiscordAPIError && e.code === 50007) {
            logger.error(`%O: Removing reminder from database.`, e);
            await ReminderRepository.delete(reminder.id);
        } else {
            logger.error(e);
        }
    }
}
